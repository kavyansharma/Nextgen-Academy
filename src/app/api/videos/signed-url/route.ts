import { NextRequest, NextResponse } from "next/server";
import { gcs } from "@/lib/gcs";
import { verifyFirebaseToken } from "@/utils/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Missing file path parameter." }, { status: 400 });
  }

  // 1. Authorize bearer token
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized. Missing authorization token." }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const uid = await verifyFirebaseToken(token);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized. Invalid token." }, { status: 401 });
  }

  try {
    // 2. Fetch user role to verify access
    const userDocRef = doc(db, "users", uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    const userData = userSnap.data();
    const role = userData.role || "free";

    // 3. Enforce video protection rules
    const isPremiumVideo = path.startsWith("videos/premium");

    if (isPremiumVideo && role !== "paid" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Premium subscription required to view this video." }, { status: 403 });
    }

    // 4. Generate GCS Signed URL or return Dev Sandbox Fallback
    if (!gcs) {
      console.warn("[Signed-URL API] Google Cloud Storage credentials are not configured or are placeholders. Returning sandbox fallback video.");
      
      // Fallback sandbox video URLs for free vs premium
      const fallbackUrl = isPremiumVideo
        ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
        : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

      return NextResponse.json({ url: fallbackUrl, isSandbox: true });
    }

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      return NextResponse.json({ error: "Storage bucket configuration missing." }, { status: 500 });
    }

    const bucket = gcs.bucket(bucketName);
    const file = bucket.file(path);

    // Generate V4 signed URL expiring in 15 minutes
    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000, // 15 mins
    });

    return NextResponse.json({ url: signedUrl, isSandbox: false });
  } catch (err: any) {
    console.error("GCS Signed URL Generation Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate file access URL." }, { status: 500 });
  }
}
