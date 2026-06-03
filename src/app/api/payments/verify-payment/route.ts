import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { verifyFirebaseToken } from "@/utils/auth";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized. Missing bearer token." }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const uid = await verifyFirebaseToken(token);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized. Invalid token." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount,
      currency = "INR",
    } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing required payment details." }, { status: 400 });
    }

    // 1. Verify cryptographic signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
    const hmac = crypto.createHmac("sha256", keySecret);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpaySignature) {
      console.error("Signature verification mismatch");
      return NextResponse.json({ error: "Payment verification failed. Invalid signature." }, { status: 400 });
    }

    // 2. Retrieve user details
    const userDocRef = doc(db, "users", uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }
    const userData = userSnap.data();

    // 3. Store Payment Document
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const paymentDoc = {
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      userId: uid,
      amount: Number(amount) || 0,
      currency,
      status: "success",
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "payments", paymentId), paymentDoc);

    // 4. Store Subscription Document based on plan
    const startDate = new Date();
    const expiryDate = new Date();
    const chosenPlan = body.plan || "premium_yearly";

    if (chosenPlan === "premium_monthly") {
      expiryDate.setMonth(startDate.getMonth() + 1);
    } else {
      // Default to 1 year
      expiryDate.setFullYear(startDate.getFullYear() + 1);
    }

    const subscriptionDoc = {
      userId: uid,
      plan: chosenPlan,
      status: "active",
      startDate: startDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      paymentId,
    };
    // Use userId as the document ID for single-subscription structure
    await setDoc(doc(db, "subscriptions", uid), subscriptionDoc);

    // 5. Update user role in Firestore
    await updateDoc(userDocRef, {
      role: "paid",
      updatedAt: new Date().toISOString()
    });

    // 6. Log Audit Action
    const auditLogDoc = {
      adminId: "SYSTEM",
      adminEmail: userData.email || "system@nextgen.com",
      action: "MEMBERSHIP_UPGRADE",
      details: `User upgraded from free to paid. UID: ${uid}, Order ID: ${razorpayOrderId}, Payment ID: ${razorpayPaymentId}`,
      timestamp: new Date().toISOString()
    };
    await addDoc(collection(db, "audit_logs"), auditLogDoc);

    // 7. Trigger User Notification
    const notificationDoc = {
      userId: uid,
      title: "Membership Upgraded",
      message: "Welcome to Premium! You now have full access to all premium courses, engineering resources, and professional certificates.",
      type: "subscription",
      read: false,
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, "notifications"), notificationDoc);

    return NextResponse.json({
      success: true,
      message: "Payment verified and membership activated.",
      subscription: subscriptionDoc,
    });
  } catch (err: any) {
    console.error("Payment Verification Error:", err);
    return NextResponse.json({ error: err.message || "Failed to verify transaction." }, { status: 500 });
  }
}
