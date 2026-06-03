import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email";
import { queryDocuments } from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const targetEmail = email.trim().toLowerCase();

    // 1. Verify user exists in Firestore
    const users = await queryDocuments("users", where("email", "==", targetEmail));
    if (users.length === 0) {
      // Return success even if not found to prevent user enumeration attacks
      return NextResponse.json({ success: true, message: "If the email exists, a reset link has been sent." });
    }

    // 2. Fetch Oob code from Firebase Identity Toolkit API
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      console.error("Firebase API Key is missing in environment variables.");
      return NextResponse.json({ error: "Server authentication error." }, { status: 500 });
    }

    const firebaseEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;
    const fbRes = await fetch(firebaseEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email: targetEmail
      })
    });

    if (!fbRes.ok) {
      const errorData = await fbRes.json().catch(() => ({}));
      console.error("Firebase sendOobCode REST failure:", errorData);
      return NextResponse.json({ error: errorData.error?.message || "Failed to generate password recovery link." }, { status: 400 });
    }

    const data = await fbRes.json();
    const resetLink = data.oobLink;

    if (!resetLink) {
      return NextResponse.json({ error: "Failed to generate reset link." }, { status: 500 });
    }

    // 3. Send email via Resend
    await sendPasswordResetEmail(targetEmail, resetLink);

    return NextResponse.json({
      success: true,
      message: "Password recovery email sent successfully."
    });
  } catch (err: any) {
    console.error("ForgotPassword API Error:", err);
    return NextResponse.json({ error: err.message || "An unexpected error occurred." }, { status: 500 });
  }
}
