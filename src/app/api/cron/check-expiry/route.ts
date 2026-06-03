import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc } from "firebase/firestore";
import { sendSubscriptionExpiryEmail, sendEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  // Validate CRON_SECRET header
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized. Invalid CRON_SECRET." }, { status: 401 });
  }
  
  try {
    const subsQuery = query(collection(db, "subscriptions"), where("status", "==", "active"));
    const querySnap = await getDocs(subsQuery);
    
    let expiredCount = 0;
    let warningCount = 0;
    const now = new Date();
    
    for (const document of querySnap.docs) {
      const sub = document.data();
      const subId = document.id; // matches userId
      const expiry = new Date(sub.expiryDate);
      
      const timeDiff = expiry.getTime() - now.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      // Fetch user profile
      const userRef = doc(db, "users", sub.userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) continue;
      const userData = userSnap.data();
      const userEmail = userData.email;
      const fullName = userData.fullName || "NextGen Member";
      
      if (daysLeft <= 0) {
        // 1. Expire subscription in Firestore
        await updateDoc(doc(db, "subscriptions", subId), {
          status: "expired",
          updatedAt: new Date().toISOString()
        });
        
        // 2. Downgrade user role
        await updateDoc(userRef, {
          role: "free",
          updatedAt: new Date().toISOString()
        });
        
        // 3. Send final notification
        await addDoc(collection(db, "notifications"), {
          userId: sub.userId,
          title: "Subscription Expired",
          message: "Your premium subscription has expired. Your account has been downgraded to the Free tier.",
          type: "subscription",
          read: false,
          createdAt: new Date().toISOString()
        });
        
        // 4. Send final expiry email if email present
        if (userEmail) {
          try {
            await sendEmail({
              to: userEmail,
              subject: "Your NextGen Academy Subscription Has Expired",
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                  <h2 style="color: #d9534f;">Membership Downgraded to Free</h2>
                  <p>Dear ${fullName},</p>
                  <p>Your premium membership at NextGen Academy expired on ${expiry.toLocaleDateString()}.</p>
                  <p>As a result, your account has been downgraded to the Free learning tier. You will no longer have access to premium courses, certificates download, or resource frameworks.</p>
                  <p>To restore your premium access, please renew your subscription inside the portal catalog.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://nextgenacademy.com/portal/courses" style="background-color: #F97316; color: #FFFFFF; padding: 12px 28px; font-weight: bold; text-decoration: none; border-radius: 10px; text-transform: uppercase;">Renew Membership</a>
                  </div>
                  <p>Warm regards,<br/>The NextGen Academy Team</p>
                </div>
              `
            });
          } catch (mailErr) {
            console.error(`Failed to send expiration email to ${userEmail}:`, mailErr);
          }
        }
        
        // 5. Audit Log
        await addDoc(collection(db, "audit_logs"), {
          adminId: "SYSTEM",
          adminEmail: "cron-check-expiry@nextgen.com",
          action: "SUBSCRIPTION_EXPIRED_CRON",
          details: `Subscription expired for user ${userEmail || sub.userId}. Downgraded to free role.`,
          timestamp: new Date().toISOString()
        });
        
        expiredCount++;
      } else if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
        // Send Warning
        if (userEmail) {
          try {
            await sendSubscriptionExpiryEmail(userEmail, fullName, daysLeft, sub.expiryDate);
          } catch (mailErr) {
            console.error(`Failed to send warning email to ${userEmail}:`, mailErr);
          }
        }
        
        // In-App Warning Notification
        await addDoc(collection(db, "notifications"), {
          userId: sub.userId,
          title: "Membership Expiring Soon",
          message: `Friendly reminder: Your premium membership will expire in ${daysLeft} ${daysLeft === 1 ? "day" : "days"} on ${expiry.toLocaleDateString()}. Renew soon to avoid losing access.`,
          type: "subscription",
          read: false,
          createdAt: new Date().toISOString()
        });
        
        warningCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: querySnap.docs.length,
      expired: expiredCount,
      warningsSent: warningCount
    });
  } catch (err: any) {
    console.error("Subscription Expiry Cron Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// Support both GET and POST for cron trigger convenience
export async function POST(req: NextRequest) {
  return GET(req);
}
