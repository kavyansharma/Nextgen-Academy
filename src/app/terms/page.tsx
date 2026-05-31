import React from "react";
import type { Metadata } from "next";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | NextGen Academy & Consulting",
  description: "NextGen Academy & Consulting Terms of Service. Review usage rules for candidates, corporate clients, and training academy applicants.",
};

export default function TermsOfService() {
  return (
    <div className="relative min-h-screen bg-brand-dark py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[300px] h-[300px] bg-brand-orange/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative space-y-8">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-brand-orange transition-colors duration-200">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-brand-orange text-xs font-semibold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Compliance & Legal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Terms of Service
          </h1>
          <p className="text-xs text-brand-text-muted">
            Last Updated: May 31, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-brand-dark-light border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl glass space-y-6 text-slate-300 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Acceptable Use</h2>
            <p>
              By accessing the NextGen Academy & Consulting website, you agree to submit only accurate, verified credentials, experiences, and corporate descriptions. Any attempt to upload malicious documents, false resumes, or spoofed project files is strictly prohibited.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Candidate Sourcing & Engagements</h2>
            <p>
              Sourcing profiles listed through NextGen Academy are curated to fit executive criteria. Sponsoring organizations and hiring clients agree to engage with candidates strictly under our bilateral service level agreements (SLAs).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Academy Certification Rules</h2>
            <p>
              Admissions to specialized technical training bootcamps are subject to capstone validations and pre-joining checks. Certifications are granted based on on-site skill audits and test evaluations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Limitation of Liability</h2>
            <p>
              While we make every effort to ensure the accuracy of submitted profiles, NextGen is not liable for errors in third-party candidate representations or operational plant adjustments performed during process optimization projects.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
