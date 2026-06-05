import React from "react";
import type { Metadata } from "next";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | NextGen Academy & Consulting",
  description: "NextGen Academy & Consulting Privacy Policy. Learn how we handle candidate profiles, resumes, company requirements, and project reports securely.",
};

export default function PrivacyPolicy() {
  return (
    <div className="relative min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-3xl mx-auto relative space-y-8">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-655 hover:text-brand-orange transition-colors duration-200">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-brand-orange text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Compliance & Legal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500">
            Last Updated: May 31, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-slate-700 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Data Collection & Purpose</h2>
            <p>
              NextGen Academy & Consulting collects professional information through recruitment, fresher, and strategic client briefing forms. This data is collected solely to evaluate candidates for executive search assignments and match students with academy training opportunities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. Resume & Document Uploads</h2>
            <p>
              Uploaded resumes, academic records, and capstone project reports are handled with absolute confidentiality. These materials are stored in secure cloud sandboxes and only shared with corporate clients or admissions directors after obtaining explicit candidate consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. Third-Party Sharing</h2>
            <p>
              We do not sell, trade, or distribute candidate contact numbers, email addresses, or personal information to third-party databases. All submissions to our API routes are routed exclusively to our secure internal databases, Google Sheets pipelines, and corporate mailboxes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. Your Rights</h2>
            <p>
              Candidates may request to withdraw their registry details, remove their resumes, or edit their designation/skills profiles at any time. To make a removal request, please email our security officer at <a href="mailto:privacy@nextgen-consulting.com" className="text-brand-orange hover:underline">privacy@nextgen-consulting.com</a>.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
