import { jwtVerify, createRemoteJWKSet, decodeJwt, decodeProtectedHeader } from "jose";

const GOOGLE_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const JWKS = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

/**
 * Helper to cryptographically verify the Firebase ID Token
 */
export async function verifyFirebaseToken(token: string): Promise<string | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID env variable");
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
      algorithms: ["RS256"]
    });
    return payload.sub || null; // 'sub' contains the Firebase UID
  } catch (err: any) {
    console.error("Firebase ID Token verification failed:", err.message);
    return null;
  }
}
