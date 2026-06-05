"use client";

import React, { useState } from "react";
import { Briefcase, ArrowLeft, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface FormFields {
  name: string;
  mobile: string;
  email: string;
  companyName: string;
  message: string;
}

export default function RecruiterForm() {
  const [fields, setFields] = useState<FormFields>({
    name: "",
    mobile: "",
    email: "",
    companyName: "",
    message: ""
  });

  const [errors, setErrors] = useState<Partial<FormFields>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const validate = () => {
    const newErrors: Partial<FormFields> = {};
    if (!fields.name.trim()) newErrors.name = "Full name is required";
    
    if (!fields.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\+?[0-9\s-]{10,15}$/.test(fields.mobile.trim())) {
      newErrors.mobile = "Please enter a valid mobile number";
    }

    if (!fields.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(fields.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!fields.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!fields.message.trim()) newErrors.message = "Message details are required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormFields]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/recruiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields)
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFields({ name: "", mobile: "", email: "", companyName: "", message: "" });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Submission error from server:", errorData.error || response.statusText);
        setSubmitStatus("error");
      }
    } catch (err) {
      console.error("Network or client-side submission error:", err);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-2xl mx-auto relative space-y-8">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-655 hover:text-brand-orange transition-colors duration-200">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-semibold uppercase tracking-wider">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Corporate / Recruiter</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Submit Hiring Requirements
          </h1>
          <p className="text-sm text-slate-600">
            Connect with our Executive Search & Talent Advisory team. Share your talent requirements, and our consultants will reach out to map your search.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          {submitStatus === "success" ? (
            <div className="text-center py-10 space-y-6 animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Requirement Submitted Successfully</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                  Thank you for submitting your hiring requirements. A NextGen talent partner will review your criteria and contact you within 24 business hours.
                </p>
              </div>
              <button 
                onClick={() => setSubmitStatus("idle")}
                className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all duration-300 shadow-sm cursor-pointer"
              >
                Submit another requirement
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Submission Error Banner */}
              {submitStatus === "error" && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>Something went wrong. Please check your inputs and try again.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Contact Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={fields.name}
                    onChange={handleChange}
                    className={`w-full bg-white border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange shadow-sm transition-colors ${
                      errors.name ? "border-rose-500 bg-rose-50/5" : "border-slate-300"
                    }`}
                    placeholder="e.g. John Doe"
                  />
                  {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <label htmlFor="companyName" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={fields.companyName}
                    onChange={handleChange}
                    className={`w-full bg-white border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange shadow-sm transition-colors ${
                      errors.companyName ? "border-rose-500 bg-rose-50/5" : "border-slate-300"
                    }`}
                    placeholder="e.g. NextGen Manufacturing Ltd"
                  />
                  {errors.companyName && <p className="text-xs text-rose-600 mt-1">{errors.companyName}</p>}
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Email Address */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={fields.email}
                    onChange={handleChange}
                    className={`w-full bg-white border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange shadow-sm transition-colors ${
                      errors.email ? "border-rose-500 bg-rose-50/5" : "border-slate-300"
                    }`}
                    placeholder="e.g. john@company.com"
                  />
                  {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <label htmlFor="mobile" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={fields.mobile}
                    onChange={handleChange}
                    className={`w-full bg-white border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange shadow-sm transition-colors ${
                      errors.mobile ? "border-rose-500 bg-rose-50/5" : "border-slate-300"
                    }`}
                    placeholder="e.g. +91 9876543210"
                  />
                  {errors.mobile && <p className="text-xs text-rose-600 mt-1">{errors.mobile}</p>}
                </div>

              </div>

              {/* Message Details */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Hiring Requirements Description *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={fields.message}
                  onChange={handleChange}
                  className={`w-full bg-white border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange shadow-sm transition-colors resize-none ${
                    errors.message ? "border-rose-500 bg-rose-50/5" : "border-slate-300"
                  }`}
                  placeholder="Describe roles, designation levels, target experience, and specific technical requirements..."
                />
                {errors.message && <p className="text-xs text-rose-600 mt-1">{errors.message}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isSubmitting ? (
                    <span>Submitting requirement...</span>
                  ) : (
                    <>
                      <span>Submit Requirement</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
