"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments } from "@/lib/services/firestoreService";
import {
  Award,
  Download,
  ExternalLink,
  Printer,
  Calendar,
  Shield,
  Loader2,
  X,
  Sparkles
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  category: string;
  instructor?: string;
}

interface CourseProgress {
  userId: string;
  courseId: string;
  progressPercentage: number;
  updatedAt?: string;
}

export default function CertificatesPage() {
  const { user } = useAuth();
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCert, setActiveCert] = useState<any | null>(null);

  useEffect(() => {
    async function fetchCertificates() {
      if (!user) return;
      try {
        setLoading(true);
        const [progressList, coursesList] = await Promise.all([
          queryDocuments("course_progress"),
          queryDocuments("courses")
        ]);

        const myProgress = progressList.filter((p: any) => p.userId === user.uid && p.progressPercentage === 100);
        
        const mapped = myProgress.map((p: any) => {
          const course = coursesList.find((c: any) => c.id === p.courseId) as Course;
          return {
            id: p.courseId,
            title: course?.title || "Unknown Course",
            category: course?.category || "General",
            instructor: course?.instructor || "Sarah Jenkins",
            completedAt: p.updatedAt || new Date().toISOString(),
            credentialId: `NG-${user.uid.substring(0, 5).toUpperCase()}-${p.courseId.substring(0, 5).toUpperCase()}`
          };
        });

        setCompletedCourses(mapped);
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
              key={cert.id}
              className="bg-portal-card border border-portal-border/60 rounded-3xl p-6 flex flex-col justify-between hover:border-portal-warning/30 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group h-72 shadow-lg"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-portal-warning/5 rounded-full blur-2xl"></div>

              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-portal-border/80 text-portal-warning group-hover:scale-105 transition-transform">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-mono text-portal-text-secondary select-all" title="Credential ID">
                    {cert.credentialId}
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-portal-warning transition-colors line-clamp-2 leading-snug">
                    {cert.title}
                  </h3>
                  <p className="text-xs text-portal-text-secondary">Instructor: {cert.instructor}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-portal-border/40 mt-3 relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-xs text-portal-text-secondary font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(cert.completedAt).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => setActiveCert(cert)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-portal-border hover:border-portal-warning text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>View</span>
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
            <div className="border-8 border-double border-portal-warning/40 p-6 sm:p-12 rounded-2xl bg-slate-950 text-center relative overflow-hidden space-y-6 select-none shadow-inner">
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
                  {activeCert.title}
                </p>
                <p className="text-[10px] text-portal-text-secondary">Category: {activeCert.category} &bull; Instructor: {activeCert.instructor}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-900/60 max-w-xl mx-auto">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-300">{new Date(activeCert.completedAt).toLocaleDateString()}</p>
                  <p className="text-[9px] text-portal-text-secondary uppercase font-semibold">Date of Issuance</p>
                </div>
                
                <div className="space-y-1 flex flex-col items-center">
                  <div className="w-24 h-1 bg-portal-warning/60 mb-1"></div>
                  <p className="text-[10px] font-bold text-white">Advisory Board</p>
                  <p className="text-[9px] text-portal-text-secondary uppercase font-semibold">NextGen Academy Corp</p>
                </div>
              </div>

              <div className="text-[9px] font-mono text-portal-text-secondary pt-4">
                Verified Credential ID: {activeCert.credentialId}
              </div>
            </div>

            {/* Actions for Certificate */}
            <div className="flex gap-4">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl border border-portal-border hover:bg-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Credentials</span>
              </button>
              <button
                onClick={() => alert("Certificate downloaded successfully! (Mocked PDF export)")}
                className="flex-1 py-3 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
