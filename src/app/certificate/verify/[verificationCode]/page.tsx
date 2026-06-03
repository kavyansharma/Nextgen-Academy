import React from "react";
import { queryDocuments } from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";
import VerificationPageClient from "./VerificationPageClient";

// Generate dynamic SEO metadata on the server
export async function generateMetadata({ params }: { params: Promise<{ verificationCode: string }> }) {
  const resolvedParams = await params;
  const verificationCode = resolvedParams.verificationCode;

  try {
    const list = await queryDocuments(
      "certificates",
      where("verificationCode", "==", verificationCode)
    );

    if (list.length > 0) {
      const cert = list[0];
      const titleText = `Verified Credential: ${cert.courseName} | NextGen Academy`;
      const descText = `Verify the authenticity of professional credential ID ${cert.certificateId} for ${cert.courseName} issued by NextGen Academy & Consulting.`;
      
      return {
        title: titleText,
        description: descText,
        openGraph: {
          title: titleText,
          description: descText,
          type: "website"
        },
        twitter: {
          card: "summary_large_image",
          title: titleText,
          description: descText
        }
      };
    }
  } catch (err) {
    console.error("Dynamic verification metadata generator error:", err);
  }

  return {
    title: "Verify Credential | NextGen Academy",
    description: "Verify professional credentials and training certificates from NextGen Academy & Consulting.",
  };
}

export default async function CertificateVerificationPage({ params }: { params: Promise<{ verificationCode: string }> }) {
  const resolvedParams = await params;
  const verificationCode = resolvedParams.verificationCode;

  return <VerificationPageClient verificationCode={verificationCode} />;
}
