import Razorpay from "razorpay";

/**
 * Returns a fresh Razorpay instance using the current env vars.
 * Called per-request so env vars are always read at runtime,
 * not at module-load time (which can cause placeholder values to be used).
 */
export function getRazorpayInstance(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || keyId.startsWith("rzp_test_placeholder") || keyId === "rzp_test_REPLACE_ME") {
    throw new Error("RAZORPAY_KEY_ID is not configured in environment variables.");
  }
  if (!keySecret || keySecret === "placeholder_secret" || keySecret === "REPLACE_ME_WITH_SECRET") {
    throw new Error("RAZORPAY_KEY_SECRET is not configured in environment variables.");
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// Legacy singleton export kept for backwards compatibility — lazily evaluated
export const razorpay = {
  get orders() {
    return getRazorpayInstance().orders;
  }
};

export default razorpay;
