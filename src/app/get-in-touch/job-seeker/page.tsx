"use client";

import React, { useState, useRef } from "react";
import { UserCheck, ArrowLeft, Upload, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
import Link from "next/link";

interface FormFields {
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  email: string;
  mobile: string;
  city: string;
  currentCompany: string;
  designation: string;
  experience: string;
  currentCtc: string;
  degree: string;
  institute: string;
  function: string;
  industry: string;
  skills: string;
}

export default function JobSeekerForm() {
  const [fields, setFields] = useState<FormFields>({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    email: "",
    mobile: "",
    city: "",
    currentCompany: "",
    designation: "",
    experience: "",
    currentCtc: "",
    degree: "",
    institute: "",
    function: "",
    industry: "",
    skills: ""
  });

  const [resume, setResume] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<FormFields> & { resume?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const newErrors: Partial<FormFields> & { resume?: string } = {};
    
    if (!fields.firstName.trim()) newErrors.firstName = "First name is required";
    if (!fields.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!fields.gender) newErrors.gender = "Gender selection is required";
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
    if (!fields.currentCompany.trim()) newErrors.currentCompany = "Current company name is required";
    if (!fields.designation.trim()) newErrors.designation = "Designation is required";
    if (!fields.experience.trim()) newErrors.experience = "Experience is required";
    if (!fields.currentCtc.trim()) newErrors.currentCtc = "Current CTC is required";
    if (!fields.degree.trim()) newErrors.degree = "Highest degree is required";
    if (!fields.institute.trim()) newErrors.institute = "Institute is required";
    if (!fields.function.trim()) newErrors.function = "Department/Function is required";
    if (!fields.industry.trim()) newErrors.industry = "Industry sector is required";
    if (!fields.skills.trim()) newErrors.skills = "Core skills list is required";

    if (!resume) {
      newErrors.resume = "Please upload your resume";
    } else {
      const allowedExt = ["pdf", "doc", "docx"];
      const ext = resume.name.split(".").pop()?.toLowerCase();
      if (!ext || !allowedExt.includes(ext)) {
        newErrors.resume = "Only PDF, DOC, or DOCX files allowed";
      } else if (resume.size > 5 * 1024 * 1024) {
        newErrors.resume = "File size must be under 5MB";
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
      setErrors((prev) => ({ ...prev, resume: "" }));
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    const formData = new FormData();
    Object.entries(fields).forEach(([key, val]) => {
      formData.append(key, val);
    });
    if (resume) {
      formData.append("resume", resume);
    }

    try {
      const response = await fetch("/api/job-seeker", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        setSubmitStatus("success");
        setResume(null);
        setFields({
          firstName: "",
          lastName: "",
          gender: "",
          dob: "",
          email: "",
          mobile: "",
          city: "",
          currentCompany: "",
          designation: "",
          experience: "",
          currentCtc: "",
          degree: "",
          institute: "",
          function: "",
          industry: "",
          skills: ""
        });
      } else {
        setSubmitStatus("error");
      }
    } catch (err) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-brand-dark py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-brand-blue/5 rounded-full blur-[90px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative space-y-8">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-brand-orange transition-colors duration-200">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-xs font-semibold uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Candidate / Experienced Job Seeker</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Experienced Professional Registry
          </h1>
          <p className="text-sm text-brand-text-muted">
            Submit your resume and details to our Executive Search panel. We map experienced Plant Heads, operational leaders, automation engineers, and specialists to active mandates.
          </p>
        </div>

        {/* Form success / main container */}
        <div className="bg-brand-dark-light border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl glass">
          {submitStatus === "success" ? (
            <div className="text-center py-12 space-y-6 animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Profile Registered Successfully</h3>
                <p className="text-sm text-brand-text-muted leading-relaxed max-w-lg mx-auto">
                  Thank you for submitting your details. Our Executive Recruitment team matches your skills against ongoing searches. We will contact you as soon as a suitable mandate opens.
                </p>
              </div>
              <button 
                onClick={() => setSubmitStatus("idle")}
                className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-orange hover:bg-slate-800 text-white text-xs font-semibold transition-all duration-300"
              >
                Submit another profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {submitStatus === "error" && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>Submission failed. Ensure all fields are filled and resume size is under 5MB.</span>
                </div>
              )}

              {/* SECTION 1: Personal Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-blue border-b border-slate-800 pb-2">
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
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
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
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
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
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
                        errors.gender ? "border-rose-500" : "border-slate-800"
                      }`}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other / Prefer not to say</option>
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
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
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
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
                        errors.email ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="yourname@gmail.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Mobile Number *</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={fields.mobile}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
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
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
                        errors.city ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="e.g. Pune, MH"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Professional Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-blue border-b border-slate-800 pb-2">
                  2. Professional Details
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Current Company *</label>
                    <input
                      type="text"
                      name="currentCompany"
                      value={fields.currentCompany}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
                        errors.currentCompany ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="Company Name / 'N/A' if idle"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Current Designation *</label>
                    <input
                      type="text"
                      name="designation"
                      value={fields.designation}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
                        errors.designation ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="Designation"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Total Experience (Years) *</label>
                    <input
                      type="text"
                      name="experience"
                      value={fields.experience}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
                        errors.experience ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="e.g. 5"
                    />
                  </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Current Annual CTC (in Lakhs / LPA) *</label>
                    <input
                      type="text"
                      name="currentCtc"
                      value={fields.currentCtc}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
                        errors.currentCtc ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="e.g. 8.5 LPA"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Function / Department *</label>
                    <input
                      type="text"
                      name="function"
                      value={fields.function}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
                        errors.function ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="e.g. Maintenance, Production"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Industry Segment *</label>
                    <select
                      name="industry"
                      value={fields.industry}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
                        errors.industry ? "border-rose-500" : "border-slate-800"
                      }`}
                    >
                      <option value="">Select Industry</option>
                      <option value="Automotive & EV">Automotive & EV</option>
                      <option value="Heavy Engineering">Heavy Engineering</option>
                      <option value="Industrial Manufacturing">Industrial Manufacturing</option>
                      <option value="FMCG">FMCG</option>
                      <option value="IT Sector">IT Sector</option>
                      <option value="Other">Other Industrial Sector</option>
                    </select>
                  </div>

                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Core Technical Skills (comma separated) *</label>
                  <textarea
                    name="skills"
                    rows={2}
                    value={fields.skills}
                    onChange={handleChange}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue resize-none ${
                      errors.skills ? "border-rose-500" : "border-slate-800"
                    }`}
                    placeholder="e.g. PLC programming, CNC operation, Kaizen, Six Sigma Green Belt, Plant commissioning"
                  />
                </div>

              </div>

              {/* SECTION 3: Academic Background */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-blue border-b border-slate-800 pb-2">
                  3. Academic Background
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Highest Qualification / Degree *</label>
                    <input
                      type="text"
                      name="degree"
                      value={fields.degree}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
                        errors.degree ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="e.g. B.Tech Mechanical Engineering, Diploma CNC"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">College / Institute Name *</label>
                    <input
                      type="text"
                      name="institute"
                      value={fields.institute}
                      onChange={handleChange}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-blue ${
                        errors.institute ? "border-rose-500" : "border-slate-800"
                      }`}
                      placeholder="College / Institute"
                    />
                  </div>

                </div>
              </div>

              {/* SECTION 4: Resume Upload */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-blue border-b border-slate-800 pb-2">
                  4. Resume Upload
                </h3>
                
                <div 
                  onClick={triggerFileSelect}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-900/50 hover:border-brand-blue transition-all duration-300 ${
                    errors.resume ? "border-rose-500 bg-rose-500/5" : "border-slate-800 bg-slate-950/20"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className={`w-8 h-8 ${errors.resume ? "text-rose-400" : "text-brand-blue"}`} />
                    <p className="text-sm font-semibold text-white">
                      {resume ? resume.name : "Click to select or drag and drop your Resume"}
                    </p>
                    <p className="text-xs text-brand-text-muted">
                      Supported formats: PDF, DOC, DOCX (Max size: 5MB)
                    </p>
                  </div>
                </div>
                {errors.resume && <p className="text-xs text-rose-400 mt-1 text-center">{errors.resume}</p>}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Registering profile...</span>
                  ) : (
                    <span>Register Profile & Resume</span>
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
