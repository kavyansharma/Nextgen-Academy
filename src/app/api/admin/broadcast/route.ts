import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/utils/auth";
import { db } from "@/lib/firebase";
import { sendBroadcastEmail } from "@/lib/email";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

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
    // 1. Verify Admin Permissions
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists() || userSnap.data().role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { title, messageContent, targetRole } = body;

    if (!title || !messageContent || !targetRole) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 2. Fetch Targeted Users
    let usersQuery;
    if (targetRole === "all") {
      usersQuery = query(collection(db, "users"));
    } else {
      usersQuery = query(collection(db, "users"), where("role", "==", targetRole));
    }

    const querySnap = await getDocs(usersQuery);
    const emails: string[] = [];
    querySnap.forEach((doc) => {
      const data = doc.data();
      if (data.email) {
        emails.push(data.email);
      }
    });

    if (emails.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No targeted users found for this role." });
    }

    // 3. Dispatch Emails Concurrently via Resend
    const sendPromises = emails.map((email) => 
      sendBroadcastEmail(email, title, messageContent)
        .catch(err => {
          console.error(`Failed to send broadcast email to ${email}:`, err);
          return null;
        })
    );

    await Promise.all(sendPromises);

    return NextResponse.json({
      success: true,
      count: emails.length,
      message: `Broadcast emails successfully dispatched to ${emails.length} users.`
    });
  } catch (err: any) {
    console.error("Admin Broadcast Endpoint Error:", err);
    return NextResponse.json({ error: err.message || "Failed to dispatch email broadcast." }, { status: 500 });
  }
}
