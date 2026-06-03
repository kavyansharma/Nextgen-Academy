"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Resource } from "@/data/resources";
import PurchaseCard from "@/components/PurchaseCard";
import {
  ArrowLeft,
  FileText,
  Download,
  ExternalLink,
  Unlock,
  Loader2,
  AlertCircle
} from "lucide-react";
import { queryDocuments, updateDocument } from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";

interface ResourceViewerProps {
  resource: Resource;
}

export default function ResourceViewer({ resource }: ResourceViewerProps) {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();

  // PDF states
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Enforce authentication gate on client side
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/portal/login");
    }
  }, [user, loading, router]);

  // Gating access checks:
  // Admin & Paid users can view all resources (both free & paid).
  // Free users can only view free resources.
  const hasAccess =
    resource.type === "free" ||
    user?.role === "admin" ||
    user?.role === "paid";

  // Fetch Paid PDF as Blob URL & Cleanup
  useEffect(() => {
    let objectUrl: string | null = null;

    const loadPdf = async () => {
      // If resource is free, we don't need token headers; serve public PDF directly
      if (resource.type === "free") {
        setPdfUrl(resource.fileUrl);
        setLoadingPdf(false);
        return;
      }

      // If user has no access to this paid resource or firebaseUser is not loaded, do not fetch
      if (!hasAccess || !firebaseUser) {
        setPdfUrl(null);
        setLoadingPdf(false);
        return;
      }

      try {
        setLoadingPdf(true);
        setPdfError(null);

        // Fetch Firebase client ID Token
        const idToken = await firebaseUser.getIdToken();

        // Fetch PDF binary from API route passing Authorization header
        const response = await fetch(resource.fileUrl, {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error || `HTTP error ${response.status}`);
        }

        // Generate Blob Object URL
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (err: any) {
        console.error("Error loading secure PDF catalog item:", err);
        setPdfError(err.message || "Failed to retrieve secure document binary.");
      } finally {
        setLoadingPdf(false);
      }
    };

    if (user && firebaseUser) {
      loadPdf();
    } else if (user && resource.type === "free") {
      // If free and firebaseUser might not be loaded yet, we can load the free resource
      loadPdf();
    }

    // Cleanup: Revoke Blob URLs on component cleanup
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [resource, user, firebaseUser, hasAccess]);

  useEffect(() => {
    if (user && hasAccess && resource) {
      import("@/lib/services/activityService").then(({ trackResourceView }) => {
        trackResourceView(user.uid, resource.slug, resource.title);
      });
      import("@/lib/analytics").then(({ trackEvent }) => {
        trackEvent({
          action: "resource_download",
          category: "resources",
          label: resource.title
        });
      });
    }
  }, [user, hasAccess, resource]);

  if (loading || !user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-brand-dark">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto text-brand-orange" />
          <p className="text-brand-text-muted text-sm tracking-wide">Retrieving access permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 bg-brand-dark overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto z-10 relative space-y-8 animate-fade-in text-slate-100">

        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-2">
            <Link
              href="/portal/resources"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text-muted hover:text-brand-orange transition-colors duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Directory</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 text-brand-blue border border-slate-800">
                {resource.category}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${resource.type === "free"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}>
                {resource.type} Resource
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl pt-1">
              {resource.title}
            </h1>
            <p className="text-sm text-brand-text-muted max-w-3xl leading-relaxed">{resource.description}</p>
          </div>

          {/* User role details badge */}
          <div className="flex items-center gap-2 self-start md:self-center bg-slate-900 border border-slate-800 rounded-full px-4 py-2">
            <Unlock className="w-4 h-4 text-brand-orange animate-pulse" />
            <span className="text-xs text-slate-300 font-medium capitalize">User Tier: {user.role}</span>
          </div>
        </div>

        {/* ACCESS LOGIC VIEW PORT */}
        {hasAccess ? (
          /* ACCESSIBLE VIEW: EMBEDDED PDF VIEWER */
          <div className="space-y-6">
            {/* Action Bar (View & downloads - rendered once loaded) */}
            {!loadingPdf && !pdfError && pdfUrl && (
              <div className="flex flex-wrap gap-3 items-center">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-brand-orange text-xs font-semibold text-slate-200 hover:text-white transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                >
                  <span>View Fullscreen</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <a
                  href={pdfUrl}
                  download={`${resource.slug}.pdf`}
                  onClick={async () => {
                    try {
                      const docs = await queryDocuments("resources", where("slug", "==", resource.slug));
                      if (docs.length > 0) {
                        const docId = docs[0].id;
                        const currentCount = docs[0].downloadCount || 0;
                        await updateDocument("resources", docId, {
                          downloadCount: currentCount + 1
                        });
                      }
                    } catch (err) {
                      console.error("Failed to increment download count:", err);
                    }
                  }}
                  className="px-5 py-3 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Download PDF</span>
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* Embedded Iframe PDF Viewer / Loading / Error states */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-2xl glass p-1">
              {loadingPdf ? (
                /* PDF loading state */
                <div className="w-full h-[850px] rounded-xl bg-slate-950 flex items-center justify-center border border-slate-850/10">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto text-brand-orange" />
                    <p className="text-sm text-brand-text-muted">Downloading document securely...</p>
                  </div>
                </div>
              ) : pdfError ? (
                /* PDF fetch failure */
                <div className="w-full h-[850px] rounded-xl bg-slate-950 flex items-center justify-center border border-slate-850/10 p-8">
                  <div className="text-center space-y-4 max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
                    <p className="font-bold text-white text-lg">Error Loading Document</p>
                    <p className="text-xs text-brand-text-muted bg-slate-900 border border-red-500/20 p-4 rounded-xl font-mono leading-relaxed break-words">
                      {pdfError}
                    </p>
                  </div>
                </div>
              ) : (
                /* PDF Embedded View */
                pdfUrl && (
                  <iframe
                    src={pdfUrl}
                    title={resource.title}
                    className="w-full h-[850px] rounded-xl bg-slate-900"
                  />
                )
              )}
            </div>
          </div>
        ) : (
          /* LOCKED VIEW: PURCHASE CARD REQUIRED */
          <div className="py-12">
            <PurchaseCard
              resourceId={resource.id}
              resourceTitle={resource.title}
              price={resource.price || 0}
            />
          </div>
        )}

      </div>
    </div>
  );
}
