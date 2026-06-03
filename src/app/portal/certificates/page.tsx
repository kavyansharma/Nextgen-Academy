"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments, setDocument } from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";
import { jsPDF } from "jspdf";
import {
  Award,
  Download,
  ExternalLink,
  Printer,
  Calendar,
  Shield,
  Loader2,
  X,
  Sparkles,
  Lock,
  CheckCircle2
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  category: string;
  instructor?: string;
  type: "free" | "premium";
}

interface CourseProgressDoc {
  userId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  completedAt: string;
}

interface CertificateRecord {
  certificateId: string;
  userId: string;
  courseId: string;
  courseName: string;
  issuedAt: string;
  verificationCode: string;
  instructor?: string;
  category?: string;
}

export default function CertificatesPage() {
  const { user } = useAuth();
  const [completedCourses, setCompletedCourses] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCert, setActiveCert] = useState<CertificateRecord | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function fetchCertificates() {
      if (!user) return;
      try {
        setLoading(true);

        // Query collections
        const [progressList, coursesList, certsList] = await Promise.all([
          queryDocuments("course_progress", where("userId", "==", user.uid)) as Promise<CourseProgressDoc[]>,
          queryDocuments("courses") as Promise<Course[]>,
          queryDocuments("certificates", where("userId", "==", user.uid)) as Promise<CertificateRecord[]>
        ]);

        // Filter progress for completed lessons
        const myCompletions = progressList.filter(p => p.completed === true);
        
        // Group by courseId
        const completionsMap: Record<string, string[]> = {};
        myCompletions.forEach(p => {
          if (!completionsMap[p.courseId]) {
            completionsMap[p.courseId] = [];
          }
          if (!completionsMap[p.courseId].includes(p.lessonId)) {
            completionsMap[p.courseId].push(p.lessonId);
          }
        });

        // Determine if course is 100% completed
        const completedList: CertificateRecord[] = [];
        
        for (const courseId of Object.keys(completionsMap)) {
          const course = coursesList.find(c => c.id === courseId);
          if (!course) continue;

          // Fetch lessons in subcollection courses/{courseId}/lessons
          const courseLessons = await queryDocuments(`courses/${courseId}/lessons`);
          const totalLessons = courseLessons.length;

          if (totalLessons > 0 && completionsMap[courseId].length === totalLessons) {
            // Check if certificate document already exists in Firestore certsList
            let certRecord = certsList.find(c => c.courseId === courseId);

            if (!certRecord) {
              // Auto-generate missing certificate record in Firestore
              const certId = `NG-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
              const verCode = `V-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
              
              certRecord = {
                certificateId: certId,
                userId: user.uid,
                courseId: course.id,
                courseName: course.title,
                issuedAt: new Date().toISOString(),
                verificationCode: verCode,
                instructor: course.instructor || "Sarah Jenkins",
                category: course.category
              };

              await setDocument("certificates", certId, certRecord);

              // Log audit trail for user action
              await setDocument("audit_logs", `LOG-CERT-${Date.now()}`, {
                adminId: "SYSTEM",
                adminEmail: user.email,
                action: "CERTIFICATE_EARNED",
                details: `User earned certificate ${certId} for course ${course.title}`,
                timestamp: new Date().toISOString()
              });

              // Add notification
              await setDocument("notifications", `NOTIF-CERT-${Date.now()}`, {
                userId: user.uid,
                title: "Certificate Earned!",
                message: `Congratulations! You have completed "${course.title}" and earned your official certificate.`,
                type: "certificate",
                read: false,
                createdAt: new Date().toISOString()
              });
            }

            completedList.push({
              ...certRecord,
              instructor: course.instructor || "Sarah Jenkins",
              category: course.category
            });
          }
        }

        setCompletedCourses(completedList);
      } catch (err) {
        console.error("Error loading certificates:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchCertificates();
    }
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-portal-bg text-portal-text-primary">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 border-4 border-portal-primary border-t-transparent rounded-full animate-spin mx-auto text-portal-primary" />
          <p className="text-portal-text-secondary text-sm tracking-wide">Retrieving credentials...</p>
        </div>
      </div>
    );
  }

  const isPremiumUser = user.role === "admin" || user.role === "paid";

  // PDF Export using jsPDF
  const handleExportPDF = (cert: CertificateRecord) => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Background color (cream/off-white)
      doc.setFillColor(252, 251, 247);
      doc.rect(0, 0, 297, 210, "F");

      // Gold borders
      doc.setDrawColor(217, 119, 6); // Amber-600 gold
      doc.setLineWidth(1.5);
      doc.rect(8, 8, 281, 194, "D");
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 277, 190, "D");

      // Corner decorations (gold lines)
      doc.setLineWidth(0.8);
      doc.line(12, 12, 25, 12);
      doc.line(12, 12, 12, 25);
      doc.line(285, 12, 272, 12);
      doc.line(285, 12, 285, 25);
      doc.line(12, 198, 25, 198);
      doc.line(12, 198, 12, 185);
      doc.line(285, 198, 272, 198);
      doc.line(285, 198, 285, 185);

      // Logo / Header
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59); // slate-800
      doc.setFontSize(24);
      doc.text("NEXTGEN ACADEMY", 148.5, 35, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("PROFESSIONAL CREDENTIAL OF ACHIEVEMENT", 148.5, 42, { align: "center", charSpace: 2 });

      // Main text
      doc.setFont("times", "italic");
      doc.setFontSize(14);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("This is to certify that", 148.5, 65, { align: "center" });

      // Name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(245, 158, 11); // Amber-500
      doc.text(user.fullName, 148.5, 82, { align: "center" });

      // Divider
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(78, 88, 219, 88);

      // Certificate context
      doc.setFont("times", "italic");
      doc.setFontSize(14);
      doc.setTextColor(71, 85, 105);
      doc.text("has successfully completed the specialized professional course", 148.5, 102, { align: "center" });

      // Course title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(cert.courseName, 148.5, 118, { align: "center" });

      // Course info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Instructor: ${cert.instructor || "Sarah Jenkins"}  |  Category: ${cert.category || "General"}`, 148.5, 126, { align: "center" });

      // Gold seal watermark shape
      doc.setFillColor(254, 243, 199); // amber-100
      doc.setDrawColor(251, 191, 36); // amber-400
      doc.setLineWidth(0.5);
      doc.circle(148.5, 155, 12, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(217, 119, 6);
      doc.text("VERIFIED", 148.5, 156.5, { align: "center" });

      // Signatures
      doc.setFont("times", "italic");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("Advisory Board", 55, 165, { align: "center" });
      doc.line(30, 158, 80, 158);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("NextGen Academy Board", 55, 170, { align: "center" });

      doc.setFont("times", "italic");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("Director of Education", 242, 165, { align: "center" });
      doc.line(217, 158, 267, 158);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Academic Registry Dept.", 242, 170, { align: "center" });

      // Credentials and date footer
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`DATE OF ISSUANCE: ${new Date(cert.issuedAt).toLocaleDateString()}`, 30, 188);

      doc.setFont("helvetica", "normal");
      doc.text(`VERIFIABLE CREDENTIAL ID: ${cert.certificateId}`, 148.5, 188, { align: "center" });

      const verificationUrl = `${window.location.origin}/certificate/verify/${cert.verificationCode}`;
      doc.text(`VERIFY AT: ${verificationUrl}`, 267, 188, { align: "right" });

      doc.save(`nextgen-certificate-${cert.certificateId}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("An error occurred during certificate PDF compilation.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="border-b border-portal-border/60 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Certificates & Credentials</h1>
        <p className="text-sm text-portal-text-secondary mt-1">Claim your verified professional achievements and export print-ready PDF certificates.</p>
      </div>

      {completedCourses.length === 0 ? (
        <div className="p-16 rounded-3xl bg-portal-card border border-portal-border/60 text-center max-w-xl mx-auto space-y-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-portal-warning/10 border border-portal-warning/20 items-center justify-center text-portal-warning">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">No Credentials Found</h2>
            <p className="text-sm text-portal-text-secondary leading-relaxed">
              Complete any training course at 100% to instantly generate your verified professional certificate of achievement.
            </p>
          </div>
          <Link
            href="/portal/courses"
            className="inline-flex px-6 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-xs font-bold text-white transition-all shadow-md"
          >
            Explore Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {completedCourses.map((cert) => (
            <div
              key={cert.certificateId}
              className="bg-portal-card border border-portal-border/60 rounded-3xl p-6 flex flex-col justify-between hover:border-portal-warning/30 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group h-72 shadow-lg"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-portal-warning/5 rounded-full blur-2xl"></div>

              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-portal-border/80 text-portal-warning group-hover:scale-105 transition-transform">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-mono text-portal-text-secondary select-all" title="Credential ID">
                    {cert.certificateId}
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-portal-warning transition-colors line-clamp-2 leading-snug">
                    {cert.courseName}
                  </h3>
                  <p className="text-xs text-portal-text-secondary">Instructor: {cert.instructor}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-portal-border/40 mt-3 relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-xs text-portal-text-secondary font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(cert.issuedAt).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => setActiveCert(cert)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-portal-border hover:border-portal-warning text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>{isPremiumUser ? "Claim & Download" : "Preview Lock"}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {activeCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setActiveCert(null)}></div>
          
          <div className="relative w-full max-w-3xl bg-portal-card border border-portal-border rounded-3xl p-6 sm:p-10 shadow-2xl z-10 text-slate-100 space-y-6">
            <button
              onClick={() => setActiveCert(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-portal-text-secondary hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print-ready Certificate Mockup Frame */}
            <div id="print-area" className="border-8 border-double border-portal-warning/40 p-6 sm:p-12 rounded-2xl bg-slate-950 text-center relative overflow-hidden space-y-6 select-none shadow-inner">
              {/* Background watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                <Award className="w-[400px] h-[400px] text-portal-warning" />
              </div>

              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-portal-warning animate-pulse" />
                <span className="text-[10px] tracking-[0.2em] font-extrabold text-portal-warning uppercase">NextGen Academy Certificate</span>
                <Sparkles className="w-5 h-5 text-portal-warning animate-pulse" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xs font-serif italic text-portal-text-secondary">This is to certify that</h2>
                <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight border-b-2 border-slate-900 pb-2 max-w-md mx-auto">
                  {user.fullName}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-serif italic text-portal-text-secondary">has successfully completed the training course</h3>
                <p className="text-lg sm:text-xl font-bold text-portal-secondary max-w-lg mx-auto leading-snug">
                  {activeCert.courseName}
                </p>
                <p className="text-[10px] text-portal-text-secondary">Category: {activeCert.category} &bull; Instructor: {activeCert.instructor}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-900/60 max-w-xl mx-auto">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-300">{new Date(activeCert.issuedAt).toLocaleDateString()}</p>
                  <p className="text-[9px] text-portal-text-secondary uppercase font-semibold">Date of Issuance</p>
                </div>
                
                <div className="space-y-1 flex flex-col items-center">
                  <div className="w-24 h-1 bg-portal-warning/60 mb-1"></div>
                  <p className="text-[10px] font-bold text-white">Advisory Board</p>
                  <p className="text-[9px] text-portal-text-secondary uppercase font-semibold">NextGen Academy Corp</p>
                </div>
              </div>

              <div className="text-[9px] font-mono text-portal-text-secondary pt-4">
                Verified Credential ID: {activeCert.certificateId}
              </div>
            </div>

            {/* Actions for Certificate */}
            <div className="flex gap-4">
              {isPremiumUser ? (
                <>
                  <button
                    onClick={() => window.print()}
                    className="flex-grow flex-1 py-3.5 rounded-xl border border-portal-border hover:bg-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Credentials</span>
                  </button>
                  <button
                    onClick={() => handleExportPDF(activeCert)}
                    disabled={isExporting}
                    className="flex-grow flex-1 py-3.5 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Export PDF</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="w-full p-4 bg-slate-900 border border-portal-warning/30 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-xs text-portal-text-secondary">
                    <Lock className="w-4 h-4 text-portal-warning" />
                    <span>Premium account required to download verified certificate PDF files.</span>
                  </div>
                  <button
                    onClick={() => alert("Select a Premium Course in the catalog and click 'Unlock Premium Course' to upgrade membership.")}
                    className="px-4 py-2.5 rounded-xl bg-portal-warning hover:bg-portal-warning/90 text-slate-950 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                  >
                    Unlock Certificate
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
