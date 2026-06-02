import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { jwtVerify, createRemoteJWKSet, decodeJwt, decodeProtectedHeader } from "jose";

// Google's public JSON Web Key Set (JWKS) URL for Firebase Auth
const GOOGLE_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken-system@system.gserviceaccount.com";
const JWKS = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

/**
 * Helper to cryptographically verify the Firebase ID Token
 */
async function verifyFirebaseToken(token: string): Promise<string | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  console.log("[DEBUG] verifyFirebaseToken: projectId exists =", !!projectId);

  try {
    const decodedHeader = decodeProtectedHeader(token);
    console.log("[DEBUG] verifyFirebaseToken: decoded header kid =", decodedHeader.kid);
  } catch (err: any) {
    console.error("[DEBUG] verifyFirebaseToken: failed to decode header:", err.message);
  }

  try {
    const decodedPayload = decodeJwt(token);
    console.log("[DEBUG] verifyFirebaseToken: decoded payload aud =", decodedPayload.aud);
    console.log("[DEBUG] verifyFirebaseToken: decoded payload iss =", decodedPayload.iss);
  } catch (err: any) {
    console.error("[DEBUG] verifyFirebaseToken: failed to decode payload:", err.message);
  }

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
    console.error("[DEBUG] verifyFirebaseToken: jose verification error message =", err.message);
    console.error("Firebase ID Token verification failed:", err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get("id");

  // Validate resourceId
  if (!resourceId) {
    return NextResponse.json({ error: "Missing resource ID parameter." }, { status: 400 });
  }

  // 1. Extract Bearer Token from Authorization Header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized. Missing Authorization header." }, { status: 401 });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // 2. Verify Firebase JWT Token
  const verifiedUid = await verifyFirebaseToken(token);
  if (!verifiedUid) {
    return NextResponse.json({ error: "Unauthorized. Invalid or expired token." }, { status: 401 });
  }

  try {
    // 3. Retrieve user profile document from Firestore to verify role
    const userDocRef = doc(db, "users", verifiedUid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return NextResponse.json({ error: "User profile record not found in database." }, { status: 404 });
    }

    const userData = userDocSnap.data();
    const role = userData.role || "free";

    // 4. Access validation checks
    // Paid resources mapping
    const paidResourceIds = ["industry-4-playbook", "exec-leadership-guide"];
    const isPaidOnly = paidResourceIds.includes(resourceId);

    if (isPaidOnly && role !== "paid" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Premium subscription required to access this file." }, { status: 403 });
    }

    // 5. Map resource ID to corresponding filename
    const fileMap: Record<string, string> = {
      "industry-4-playbook": "industry-4-playbook.pdf",
      "exec-leadership-guide": "exec-leadership-guide.pdf"
    };

    const fileName = fileMap[resourceId];
    if (!fileName) {
      return NextResponse.json({ error: "Resource item not found in catalog." }, { status: 404 });
    }

    // 6. Build file path in private storage folder
    const filePath = path.join(process.cwd(), "src", "private", "resources", fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Resource PDF asset not found in storage." }, { status: 404 });
    }

    // 7. Read and stream PDF binary file
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, max-age=3600"
      }
    });

  } catch (err: any) {
    console.error("API Resources Route Error:", err);
    return NextResponse.json({ error: "Internal server error occurred." }, { status: 500 });
  }
}
