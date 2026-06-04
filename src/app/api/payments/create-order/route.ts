import { NextRequest, NextResponse } from "next/server";
import { getRazorpayInstance } from "@/lib/razorpay";
import { verifyFirebaseToken } from "@/utils/auth";

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized. Missing bearer token." }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const uid = await verifyFirebaseToken(token);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized. Invalid token." }, { status: 401 });
  }

  // ── Diagnostics (safe — no secret values logged) ──────────────────────────
  const keyId = process.env.RAZORPAY_KEY_ID;
  const secretExists = !!(process.env.RAZORPAY_KEY_SECRET);
  console.log("[create-order] RAZORPAY_KEY_ID:", keyId ?? "MISSING");
  console.log("[create-order] RAZORPAY_KEY_SECRET exists:", secretExists);
  console.log("[create-order] uid:", uid);

  try {
    // ── Validate env vars ─────────────────────────────────────────────────
    if (!keyId || !secretExists) {
      console.error("[create-order] Razorpay env vars missing.");
      return NextResponse.json(
        { error: "Payment gateway not configured. Missing Razorpay credentials." },
        { status: 503 }
      );
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const body = await req.json();
    const { amount, currency = "INR" } = body;
    console.log("[create-order] body received:", { amount, currency });

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
    }

    // Razorpay expects amount in subunits (paise for INR — min 100 = ₹1)
    const amountInSubunits = Math.round(Number(amount) * 100);
    console.log("[create-order] amount in paise:", amountInSubunits);

    if (amountInSubunits < 100) {
      return NextResponse.json({ error: "Amount too low. Minimum is ₹1 (100 paise)." }, { status: 400 });
    }

    // ── Create Razorpay Order ─────────────────────────────────────────────
    const razorpay = getRazorpayInstance();
    const options = {
      amount: amountInSubunits,
      currency,
      receipt: `rcpt_${Date.now()}_${uid.substring(0, 5)}`,
      notes: { userId: uid },
    };

    console.log("[create-order] Creating Razorpay order with options:", options);
    const order = await razorpay.orders.create(options);
    console.log("[create-order] Order created successfully:", order.id, "status:", order.status);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    });

  } catch (err: any) {
    // ── Detailed error reporting ──────────────────────────────────────────
    const razorpayError = err?.error;
    const statusCode = err?.statusCode ?? 500;

    console.error("[create-order] EXCEPTION:", {
      statusCode,
      message: err?.message,
      razorpayError,
      stack: err?.stack?.split("\n").slice(0, 4).join("\n"),
    });

    // Surface the Razorpay API error description if available
    const userMessage = razorpayError?.description
      ?? razorpayError?.error?.description
      ?? err?.message
      ?? "Failed to create payment order.";

    return NextResponse.json(
      {
        error: userMessage,
        code: razorpayError?.code ?? "INTERNAL_ERROR",
        razorpay_status: statusCode,
      },
      { status: 500 }
    );
  }
}
