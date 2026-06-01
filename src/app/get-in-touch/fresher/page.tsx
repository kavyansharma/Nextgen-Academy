"use client";

import React, { useState, useRef } from "react";
import { GraduationCap, ArrowLeft, Upload, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import Link from "next/link";

interface FormFields {
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  email: string;
  mobile: string;
  city: string;
  degree: string;
  institute: string;
  industrialProject: string;
}

export default function FresherForm() {
  const [fields, setFields] = useState<FormFields>({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    email: "",
    mobile: "",
    city: "",
    degree: "",
    institute: "",
    industrialProject: ""
  });

  const [resume, setResume] = useState<File | null>(null);
  const [projectReport, setProjectReport] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<FormFields> & { resume?: string; projectReport?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const newErrors: Partial<FormFields> & { resume?: string; projectReport?: string } = {};

    if (!fields.firstName.trim()) newErrors.firstName = "First name is required";
    if (!fields.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!fields.gender) newErrors.gender = "Gender is required";
    if (!fields.dob) newErrors.dob = "Date of birth is required";

    if (!fields.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(fields.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!fields.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\+?[0-9\s-]{10,15}$/.test(fields.mobile.trim())) {
      newErrors.mobile = "Enter a valid number";
    }

    if (!fields.city.trim()) newErrors.city = "City is required";
    if (!fields.degree.trim()) newErrors.degree = "Degree details are required";
    if (!fields.institute.trim()) newErrors.institute = "Institute is required";
    if (!fields.industrialProject.trim()) newErrors.industrialProject = "Project summary is required";

    const allowedExt = ["pdf", "doc", "docx"];

    // Validate Resume
    if (!resume) {
      newErrors.resume = "Resume is required";
    } else {
      const ext = resume.name.split(".").pop()?.toLowerCase();
      if (!ext || !allowedExt.includes(ext)) {
        newErrors.resume = "PDF, DOC, or DOCX only";
      } else if (resume.size > 10 * 1024 * 1024) {
        newErrors.resume = "Under 10MB required";
      }
    }

    // Validate Project Report
    if (!projectReport) {
      newErrors.projectReport = "Industrial project report is required";
    } else {
      const ext = projectReport.name.split(".").pop()?.toLowerCase();
      if (!ext || !allowedExt.includes(ext)) {
        newErrors.projectReport = "PDF, DOC, or DOCX only";
      } else if (projectReport.size > 10 * 1024 * 1024) {
        newErrors.projectReport = "Under 10MB required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormFields]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
      setErrors((prev) => ({ ...prev, resume: "" }));
    }
  };

  const handleReportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProjectReport(e.target.files[0]);
      setErrors((prev) => ({ ...prev, projectReport: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage(null);
    setUploadProgress(0);

    const formData = new FormData();
    Object.entries(fields).forEach(([key, val]) => {
      formData.append(key, val);
    });
    if (resume) formData.append("resume", resume);
    if (projectReport) formData.append("projectReport", projectReport);

    const xhr = new XMLHttpRequest();

    // Track upload progress (client -> server)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        // Cap client upload progress at 90%, the remaining 10% is server processing (Drive upload)
        setUploadProgress(Math.min(percentComplete, 90));
      }
    };

    xhr.onload = async () => {
      setIsSubmitting(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadProgress(100);
        setSubmitStatus("success");
        setResume(null);
        setProjectReport(null);
        setFields({
          firstName: "",
          lastName: "",
          gender: "",
          dob: "",
          email: "",
          mobile: "",
          city: "",
          degree: "",
          institute: "",
          industrialProject: ""
        });
      } else {
        let errorMsg = "Something went wrong.";
        try {
          const res = JSON.parse(xhr.responseText);
          errorMsg = res.error || errorMsg;
        } catch {}
        console.error("Submission error from server:", errorMsg);
        setErrorMessage(errorMsg);
        setSubmitStatus("error");
      }
    };

    xhr.onerror = () => {
      setIsSubmitting(false);
      console.error("Network or client-side submission error.");
      setErrorMessage("Network error occurred during submission.");
      setSubmitStatus("error");
    };

    xhr.open("POST", "/api/fresher");
    xhr.send(formData);
  };

  return (
    <div className="relative min-h-screen bg-brand-dark py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute bottom-1/4 left-1/4 -translate-x-1/2 w-[300px] h-[300px] bg-brand-orange/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative space-y-8">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-brand-orange transition-colors duration-200">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Graduate / Fresher Entry</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Performance Academy Enrollment
          </h1>
          <p className="text-sm text-brand-text-muted">
            Launch your career in the core engineering sectors. Register your interest, submit your college capstone/industrial project report, and apply for our validation academies.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-brand-dark-light border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl glass">
          {submitStatus === "success" ? (
            <div className="text-center py-12 space-y-6 animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Application Received</h3>
                <p className="text-sm text-brand-text-muted leading-relaxed max-w-lg mx-auto">
                  Thank you for applying. A NextGen Performance Academy coordinator will evaluate your graduation details and project report, and connect with you regarding active validation batches.
                </p>
              </div>
              <button 
                onClick={() => setSubmitStatus("idle")}
                className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-orange hover:bg-slate-800 text-white text-xs font-semibold transition-all duration-300"
              >
                Submit another application
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {submitStatus === "error" && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-sm animate-fade-in">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>{errorMessage || "Application failed. Verify file sizes are correct (Resume: 10MB, Report: 10MB)."}</span>
                </div>
              )}

              {/* SECTION 1: Personal Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
                  1. Personal Details
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={fields.firstName}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 ${
                        errors.firstName ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="First Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={fields.lastName}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 ${
                        errors.lastName ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="Last Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Gender *</label>
                    <select
                      name="gender"
                      value={fields.gender}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 ${
                        errors.gender ? "border-rose-500" : "border-slate-800"
                      }`}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Date of Birth *</label>
                    <input
                      type="date"
                      name="dob"
                      value={fields.dob}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 ${
                        errors.dob ? "border-rose-500" : "border-slate-800"
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={fields.email}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 ${
                        errors.email ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="name@gmail.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Mobile Number *</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={fields.mobile}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 ${
                        errors.mobile ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="Mobile number"
                    />
                  </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">City / Location *</label>
                    <input
                      type="text"
                      name="city"
                      value={fields.city}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 ${
                        errors.city ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="e.g. Bangalore"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Academic Profile */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
                  2. Academic Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Degree & Specialization *</label>
                    <input
                      type="text"
                      name="degree"
                      value={fields.degree}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 ${
                        errors.degree ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="e.g. B.E. Electrical Engineering (2026 Batch)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Institute / University Name *</label>
                    <input
                      type="text"
                      name="institute"
                      value={fields.institute}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 ${
                        errors.institute ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="e.g. NIT Trichy"
                    />
                  </div>

                </div>
              </div>

              {/* SECTION 3: Industrial Capstone Project */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
                  3. Industrial Capstone Project
                </h3>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Project Description *</label>
                  <textarea
                    name="industrialProject"
                    rows={4}
                    value={fields.industrialProject}
                    onChange={handleChange}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 resize-none ${
                      errors.industrialProject ? "border-rose-500" : "border-slate-800"
                    }`}
                    placeholder="Describe your major industrial academic project, your role, tools used, and the operational results..."
                  />
                </div>
              </div>

              {/* SECTION 4: Dual File Uploads */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
                  4. Document Submission
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* File 1: Resume */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Resume Upload *</label>
                    <div 
                      onClick={() => resumeInputRef.current?.click()}
                      className={`border border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-slate-900/50 hover:border-amber-400 transition-all ${
                        errors.resume ? "border-rose-500 bg-rose-500/5" : "border-slate-800 bg-slate-950/20"
                      }`}
                    >
                      <input
                        type="file"
                        ref={resumeInputRef}
                        onChange={handleResumeChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                      />
                      <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                      <span className="text-xs font-semibold text-white block truncate">
                        {resume ? resume.name : "Select Resume File"}
                      </span>
                      <span className="text-[10px] text-brand-text-muted">PDF/DOCX under 10MB</span>
                    </div>
                    {errors.resume && <p className="text-xs text-rose-400 mt-1">{errors.resume}</p>}
                  </div>

                  {/* File 2: Project Report */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Project Report Upload *</label>
                    <div 
                      onClick={() => reportInputRef.current?.click()}
                      className={`border border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-slate-900/50 hover:border-amber-400 transition-all ${
                        errors.projectReport ? "border-rose-500 bg-rose-500/5" : "border-slate-800 bg-slate-950/20"
                      }`}
                    >
                      <input
                        type="file"
                        ref={reportInputRef}
                        onChange={handleReportChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                      />
                      <FileText className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                      <span className="text-xs font-semibold text-white block truncate">
                        {projectReport ? projectReport.name : "Select Project Report"}
                      </span>
                      <span className="text-[10px] text-brand-text-muted">PDF/DOCX under 10MB</span>
                    </div>
                    {errors.projectReport && <p className="text-xs text-rose-400 mt-1">{errors.projectReport}</p>}
                  </div>

                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 space-y-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting application...</span>
                  ) : (
                    <span>Submit Application</span>
                  )}
                </button>

                {isSubmitting && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex justify-between text-xs text-slate-300 font-semibold">
                      <span>{uploadProgress < 90 ? "Uploading files..." : "Saving to Google Drive & Sheets..."}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
