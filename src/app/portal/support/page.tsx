"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  Mail,
  MessageSquare,
  FileText,
  CheckCircle2,
  ChevronDown,
  Loader2
} from "lucide-react";

export default function SupportPage() {
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How do I download my course certificates?",
      a: "Certificates are automatically generated and claimed once a course is 100% completed. Go to the Certificates section in the left sidebar to view and download them."
    },
    {
      q: "What is the difference between Free and Premium accounts?",
      a: "Free accounts can access standard articles, resources, and free fundamentals courses. Paid/Admin accounts unlock advanced consulting playbooks, premium video courses, certification paths, and print-ready credentials."
    },
    {
      q: "How do I upgrade my user subscription status?",
      a: "To upgrade, try clicking any premium course card in the catalog and choose 'Upgrade Membership' inside the premium lock overlay. This will simulate a secure payment and immediately promote your profile role."
    },
    {
      q: "Who do I contact for custom corporate training programs?",
      a: "Please email our consulting directors directly at info@nextgen-consulting.com or submit a ticket here with details of your team sizing and training requirements."
    }
  ];

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTicketSubject("");
      setTicketMessage("");
      setTimeout(() => setIsSubmitted(false), 4000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="border-b border-portal-border/60 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Support Center</h1>
        <p className="text-sm text-portal-text-secondary mt-1">Submit support tickets, browse technical documentation, and find answers to frequently asked questions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: FAQ accordion list */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary">Frequently Asked Questions</h3>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-portal-card border border-portal-border/60 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4.5 flex justify-between items-center gap-4 text-xs font-bold text-white hover:bg-slate-900/40 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-portal-text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="p-4.5 pt-0 text-xs text-portal-text-secondary leading-relaxed border-t border-portal-border/30 bg-slate-950/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Ticket Form */}
        <form onSubmit={handleTicketSubmit} className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 space-y-5 shadow-sm h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-portal-text-secondary flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-portal-primary" />
            <span>Open Support Ticket</span>
          </h3>

          {isSubmitted && (
            <div className="p-3 bg-portal-success/10 border border-portal-success/20 rounded-xl text-[10px] text-portal-success flex items-center gap-2 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Ticket submitted successfully! Our helpdesk will contact you shortly.</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-portal-text-secondary uppercase mb-1">Ticket Subject</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Certificate rendering issue"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-portal-border/60 text-white placeholder-slate-600 focus:outline-none focus:border-portal-primary text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-portal-text-secondary uppercase mb-1">Detailed Message</label>
              <textarea
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                rows={4}
                placeholder="Describe your issue or query details here..."
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-portal-border/60 text-white placeholder-slate-600 focus:outline-none focus:border-portal-primary text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Ticket</span>
            )}
          </button>
        </form>
      </div>

      {/* Extra contact links */}
      <div className="p-6 rounded-2xl bg-slate-950/40 border border-portal-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 border border-portal-border/60 rounded-xl text-portal-secondary">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Direct Enterprise Support</h4>
            <p className="text-[10px] text-portal-text-secondary mt-0.5">Need immediate assistance? Reach our plant management coordinators.</p>
          </div>
        </div>
        <a
          href="mailto:support@nextgen-consulting.com"
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-portal-border text-xs font-bold text-slate-200 hover:text-white transition-all"
        >
          support@nextgen-consulting.com
        </a>
      </div>
    </div>
  );
}
