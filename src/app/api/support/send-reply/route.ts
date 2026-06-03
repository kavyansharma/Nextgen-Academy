import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/utils/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { sendBroadcastEmail } from "@/lib/email";

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
    const { userEmail, userName, ticketId, ticketSubject, replyText } = body;

    if (!userEmail || !userName || !ticketId || !ticketSubject || !replyText) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 2. Dispatch Email
    await sendBroadcastEmail(
      userEmail,
      `Update on ticket [${ticketId}] - NextGen Academy`,
      `Hello ${userName},\n\nOur administrator team has replied to your support ticket regarding: "${ticketSubject}".\n\nResponse:\n"${replyText.trim()}"\n\nPlease login to the student portal to review the ticket details.\n\nWarm regards,\nNextGen Academy Support Team`
    );

    return NextResponse.json({ success: true, message: "Reply email dispatched successfully." });
  } catch (err: any) {
    console.error("Support Reply API Error:", err);
    return NextResponse.json({ error: err.message || "Failed to send reply email." }, { status: 500 });
  }
}
