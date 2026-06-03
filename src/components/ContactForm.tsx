"use client";

import React, { useState } from "react";
import { addDocument } from "@/lib/services/firestoreService";
import { CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("Corporate Training");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addDocument("contact_queries", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        category,
        message: message.trim(),
        status: "open",
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("Contact Form Submission Error:", err);
      setError((err as Error).message || "Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4 animate-fade-in">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <div>
          <h3 className="text-xl font-bold text-white">Query Received!</h3>
          <p className="text-xs text-brand-text-muted mt-1.5 leading-relaxed">
            Thank you for reaching out. One of our industrial advisors will review your inquiry and follow up within 24 business hours.
          </p>
        </div>
        <button
          onClick={() => setSuccess(false)}
          className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-slate-200">
      {error && (
        <div className="flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs animate-fade-in">
          <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">Your Name *</label>
          <input
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-850 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">Email Address *</label>
          <input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-850 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">Query Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={isSubmitting}
          className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-850 text-white focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-xs"
        >
          <option value="Corporate Training">Corporate Training Programs</option>
          <option value="Executive Recruitment">Executive Recruitment (CXO)</option>
          <option value="Strategic Consulting">Strategic Consulting</option>
          <option value="Individual Student Inquiry">Individual LMS Student Query</option>
          <option value="Other Inquiries">General / Others</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">Message details *</label>
        <textarea
          placeholder="Describe your requirements in detail..."
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSubmitting}
          required
          className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-850 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-xs resize-none"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold transition-all duration-300 hover:scale-[1.01] shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Submitting Inquiry...</span>
          </>
        ) : (
          <span>Send Message</span>
        )}
      </button>
    </form>
  );
}
