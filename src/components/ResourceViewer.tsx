"use client";

import React, { useEffect } from "react";
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
  FolderOpen
} from "lucide-react";

interface ResourceViewerProps {
  resource: Resource;
}

export default function ResourceViewer({ resource }: ResourceViewerProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Enforce authentication gate on client side
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/portal/login");
    }
  }, [user, loading, router]);

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

  // Gating access checks:
  // Admin & Paid users can view all resources (both free & paid).
  // Free users can only view free resources.
  const hasAccess = 
    resource.type === "free" || 
    user.role === "admin" || 
    user.role === "paid";

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
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                resource.type === "free" 
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
            {/* Action Bar (Free view & downloads) */}
            <div className="flex flex-wrap gap-3 items-center">
              <a
                href={resource.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-brand-orange text-xs font-semibold text-slate-200 hover:text-white transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              >
                <span>View Fullscreen</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <a
                href={resource.fileUrl}
                download={`${resource.slug}.pdf`}
                className="px-5 py-3 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              >
                <span>Download PDF</span>
                <Download className="w-4 h-4" />
              </a>
            </div>

            {/* Embedded Iframe PDF Viewer */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-2xl glass p-1">
              <iframe
                src={resource.fileUrl}
                title={resource.title}
                className="w-full h-[850px] rounded-xl bg-slate-900"
              />
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
