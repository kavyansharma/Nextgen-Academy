import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
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
    const { amount, currency = "INR" } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
    }

    // Razorpay expects amount in subunits (e.g. paise for INR, cents for USD)
    const amountInSubunits = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInSubunits,
      currency: currency,
      receipt: `receipt_order_${Date.now()}_${uid.substring(0, 5)}`,
      notes: {
        userId: uid,
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    });
  } catch (err: any) {
    console.error("Razorpay Order Creation Error:", err);
    return NextResponse.json({ error: err.message || "Failed to initiate payment gateway order." }, { status: 500 });
  }
}
