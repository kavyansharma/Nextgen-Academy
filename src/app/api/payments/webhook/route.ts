import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature") || req.headers.get("X-Razorpay-Signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature header." }, { status: 400 });
  }

  try {
    const rawBody = await req.text();
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "placeholder_webhook_secret";

    // 1. Verify Webhook Signature
    const hmac = crypto.createHmac("sha256", webhookSecret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest("hex");

    if (expectedSignature !== signature) {
      console.error("Webhook signature verification failed.");
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`[Webhook] Processing Razorpay Event: ${event}`);

    // Extract transaction properties
    const paymentEntity = payload.payload.payment?.entity;
    const orderEntity = payload.payload.order?.entity;

    // Get userId from payment notes or order notes
    const userId = paymentEntity?.notes?.userId || orderEntity?.notes?.userId;

    if (!userId) {
      console.warn("[Webhook] No userId found in notes. Event skipped.");
      return NextResponse.json({ success: true, message: "Webhook processed (no action, no userId)." });
    }

    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    const userData = userSnap.exists() ? userSnap.data() : { email: "webhook-user@nextgen.com" };

    if (event === "payment.captured" || event === "order.paid") {
      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;
      const amount = (paymentEntity?.amount || orderEntity?.amount || 0) / 100; // convert to main units
      const currency = paymentEntity?.currency || orderEntity?.currency || "INR";

      // 2. Create Payment Doc if not exists
      const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const paymentDoc = {
        paymentId,
        razorpayOrderId,
        razorpayPaymentId,
        userId,
        amount,
        currency,
        status: "success",
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "payments", paymentId), paymentDoc);

      // 3. Create Subscription Doc
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(startDate.getFullYear() + 1);

      const subscriptionDoc = {
        userId,
        plan: "premium",
        status: "active",
        startDate: startDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        paymentId,
      };
      await setDoc(doc(db, "subscriptions", userId), subscriptionDoc);

      // 4. Update user role
      await updateDoc(userDocRef, {
        role: "paid",
        updatedAt: new Date().toISOString()
      });

      // 5. Log audit trail
      await addDoc(collection(db, "audit_logs"), {
        adminId: "SYSTEM",
        adminEmail: userData.email,
        action: "WEBHOOK_PAYMENT_CAPTURE",
        details: `Auto-upgraded user to paid via webhook. Payment ID: ${razorpayPaymentId}`,
        timestamp: new Date().toISOString()
      });

      // 6. User notification
      await addDoc(collection(db, "notifications"), {
        userId,
        title: "Subscription Activated",
        message: "Your premium learning subscription has been successfully activated.",
        type: "subscription",
        read: false,
        createdAt: new Date().toISOString()
      });
    } 
    else if (event === "payment.refunded") {
      const razorpayPaymentId = paymentEntity?.id;
      const refundId = paymentEntity?.refund_status; // or custom mapping

      // 1. Downgrade user role to free
      await updateDoc(userDocRef, {
        role: "free",
        updatedAt: new Date().toISOString()
      });

      // 2. Update Subscription status to refunded
      await setDoc(doc(db, "subscriptions", userId), {
        status: "refunded",
        expiryDate: new Date().toISOString()
      }, { merge: true });

      // 3. Query payments collection to update payment status to refunded
      const paymentsQuery = query(collection(db, "payments"), where("razorpayPaymentId", "==", razorpayPaymentId));
      const paymentSnap = await getDocs(paymentsQuery);
      paymentSnap.forEach(async (docSnap) => {
        await updateDoc(doc(db, "payments", docSnap.id), {
          status: "refunded",
          refundId: refundId || "refund_success",
          updatedAt: new Date().toISOString()
        });
      });

      // 4. Log audit trail
      await addDoc(collection(db, "audit_logs"), {
        adminId: "SYSTEM",
        adminEmail: userData.email,
        action: "WEBHOOK_PAYMENT_REFUND",
        details: `Downgraded user due to refund. Payment ID: ${razorpayPaymentId}`,
        timestamp: new Date().toISOString()
      });

      // 5. User notification
      await addDoc(collection(db, "notifications"), {
        userId,
        title: "Subscription Refunded",
        message: "Your subscription has been refunded. Your account has been reverted to the Free Learning Tier.",
        type: "subscription",
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, message: "Webhook event processed." });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err.message || "Webhook processing failed." }, { status: 500 });
  }
}
