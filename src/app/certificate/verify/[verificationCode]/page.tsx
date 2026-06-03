"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { queryDocuments } from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";
import { 
  ShieldCheck, 
  Award, 
  Calendar, 
  User, 
  BookOpen, 
  AlertTriangle,
  Loader2,
  Sparkles,
  ExternalLink
} from "lucide-react";

interface Certificate {
  id: string;
  certificateId: string;
  userId: string;
  userName?: string; // we will lookup user profile or store username in the doc
  courseId: string;
  courseName: string;
  issuedAt: string;
  verificationCode: string;
}

export default function CertificateVerificationPage({ params }: { params: Promise<{ verificationCode: string }> }) {
  const unwrappedParams = use(params);
  const verificationCode = unwrappedParams.verificationCode;

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyCredential() {
      if (!verificationCode) return;
      try {
        setLoading(true);
        setError(null);

        // Query Firestore certificates collection
        const list = await queryDocuments(
          "certificates",
          where("verificationCode", "==", verificationCode)
        ) as Certificate[];

        if (list.length === 0) {
          setError("No matching verified credential could be found in our database.");
          setCertificate(null);
          return;
        }

        const cert = list[0];
        setCertificate(cert);

        // Fetch student's profile to display their full name
        const userProfileList = await queryDocuments(
          "users",
          where("uid", "==", cert.userId)
        );
        if (userProfileList.length > 0) {
          setStudentName(userProfileList[0].fullName || "NextGen Student");
        } else {
          setStudentName("Verified NextGen Student");
        }

      } catch (err: any) {
        console.error("Certificate verification error:", err);
        setError("An error occurred while verifying the credential. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    verifyCredential();
  }, [verificationCode]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Floating brand header */}
      <div className="mb-8 flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-xl text-white shadow-md">
          N
        </div>
        <span className="font-extrabold text-xl tracking-tight text-white">NextGen Academy</span>
      </div>

      <div className="w-full max-w-xl bg-slate-900/60 border border-white/5 shadow-2xl rounded-3xl p-8 glass relative overflow-hidden z-10">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"></div>

        {loading ? (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto text-amber-500" />
            <p className="text-sm text-slate-400">Verifying credential signature with database registry...</p>
          </div>
        ) : error || !certificate ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
              <AlertTriangle className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                {error || "This certificate verification code is invalid or has expired."}
              </p>
            </div>
            <div className="bg-slate-950 p-4.5 rounded-2xl border border-white/5 text-xs text-left text-slate-400 space-y-2 max-w-md mx-auto">
              <p className="font-semibold text-white">Verification Tips:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Check the characters in the URL path (case-sensitive).</li>
                <li>Make sure the student has completed the full course syllabus.</li>
                <li>Contact info@nextgen-consulting.com if you continue to experience problems.</li>
              </ul>
            </div>
            <Link
              href="/portal/login"
              className="inline-flex px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-200 transition-all border border-slate-700"
            >
              Go to Portal Login
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stamp / Badge */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
                <ShieldCheck className="w-10 h-10 animate-pulse" />
              </div>
              <h2 className="text-2xl font-extrabold text-white pt-2">Credential Verified</h2>
              <p className="text-xs text-emerald-400 uppercase tracking-widest font-bold">Official Verification Record</p>
            </div>

            {/* Achievement details */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="grid grid-cols-3 gap-2 border-b border-slate-900 pb-3 items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 col-span-1">
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span>Recipient</span>
                </span>
                <span className="text-sm font-bold text-white col-span-2 text-right">
                  {studentName}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-slate-900 pb-3 items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 col-span-1">
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                  <span>Course</span>
                </span>
                <span className="text-sm font-bold text-white col-span-2 text-right leading-snug">
                  {certificate.courseName}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-slate-900 pb-3 items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 col-span-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Issued On</span>
                </span>
                <span className="text-sm font-bold text-white col-span-2 text-right">
                  {new Date(certificate.issuedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 col-span-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>ID Code</span>
                </span>
                <span className="text-xs font-mono text-slate-300 col-span-2 text-right select-all">
                  {certificate.certificateId}
                </span>
              </div>
            </div>

            {/* Footer stamp description */}
            <div className="text-center space-y-4 pt-2">
              <span className="text-[10px] text-slate-400 font-medium tracking-wide flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Issued by NextGen Academy Advisory Board & Corporate Consulting Registry.</span>
              </span>
              <div className="border-t border-slate-800 pt-4 flex gap-4 justify-center">
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-200 transition-all border border-slate-700 flex items-center gap-1"
                >
                  <span>Visit Homepage</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
