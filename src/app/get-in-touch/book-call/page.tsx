"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function BookDiscoveryCall() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyName: "",
    topic: "Executive Search & Advisory"
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string; companyName?: string }>({});
  const [bookingFinished, setBookingFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Generate next 6 business days (excluding Sunday)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    let count = 0;
    let offset = 1;

    while (count < 6) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + offset);
      
      // If not Sunday (0)
      if (nextDate.getDay() !== 0) {
        dates.push({
          raw: nextDate.toISOString().split("T")[0],
          dayName: nextDate.toLocaleDateString("en-US", { weekday: "short" }),
          dayNum: nextDate.getDate(),
          monthName: nextDate.toLocaleDateString("en-US", { month: "short" })
        });
        count++;
      }
      offset++;
    }
    return dates;
  };

  const dates = getAvailableDates();
  const timeSlots = ["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "05:00 PM"];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: typeof errors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.companyName.trim()) newErrors.companyName = "Company is required";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!selectedDate || !selectedTime) {
      alert("Please select a date and a time slot first.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/book-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          date: selectedDate,
          time: selectedTime
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to book appointment. Please try again.");
      }

      setBookingFinished(true);
    } catch (err: any) {
      console.error("Discovery Call booking error:", err);
      setSubmitError(err.message || "Something went wrong during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-4xl mx-auto relative space-y-8">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-655 hover:text-brand-orange transition-colors duration-200">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Consultation Scheduler</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Book a Discovery Consultation
          </h1>
          <p className="text-sm text-slate-600">
            Select an active business slot below to schedule a confidential 30-minute operational strategy audit or executive search briefing with a NextGen Senior Advisor.
          </p>
        </div>

        {/* Success Confirmation state */}
        {bookingFinished ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-md animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-extrabold text-slate-900">Discovery Call Confirmed</h2>
              <p className="text-base text-slate-700">
                Scheduled for: <span className="text-brand-orange font-bold">{selectedDate}</span> at <span className="text-brand-orange font-bold">{selectedTime}</span>
              </p>
              <p className="text-sm text-slate-500 leading-relaxed max-w-lg mx-auto">
                A calendar invitation link containing MS Teams details has been sent to <span className="text-slate-900 font-semibold">{formData.email}</span>. A senior partner specialized in <span className="text-slate-900 font-semibold">{formData.topic}</span> will host the session.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-200 max-w-sm mx-auto">
              <Link 
                href="/"
                className="w-full inline-block py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-350 text-slate-700 text-sm font-semibold transition-all duration-300 shadow-sm"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Step 1: Calendar and Time Slot select (Left column) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
              
              {/* Date Select */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-brand-orange" />
                  <span>1. Select Date</span>
                </h3>
                
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {dates.map((d) => (
                    <button
                      key={d.raw}
                      type="button"
                      onClick={() => {
                        setSelectedDate(d.raw);
                        setSelectedTime(null); // Reset time when date changes
                      }}
                      className={`p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        selectedDate === d.raw 
                          ? "bg-brand-orange border-brand-orange text-white scale-102"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">{d.monthName}</span>
                      <span className="text-lg font-extrabold my-0.5">{d.dayNum}</span>
                      <span className="text-[10px] uppercase opacity-75">{d.dayName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Select */}
              {selectedDate && (
                <div className="space-y-3 animate-fade-in">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brand-blue" />
                    <span>2. Select Time Slot (30 mins)</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`py-3 px-4 rounded-xl border text-sm font-semibold text-center transition-all cursor-pointer ${
                          selectedTime === time
                            ? "bg-brand-blue border-brand-blue text-white"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Contact Form details (Right column) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <form onSubmit={handleBook} className="space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 border-b border-slate-100 pb-2">
                  3. Session Details
                </h3>

                {/* Selected Slot summary */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-1 text-slate-600">
                  <div>
                    Date: <span className="text-slate-900 font-semibold">{selectedDate || "(select above)"}</span>
                  </div>
                  <div>
                    Time: <span className="text-slate-900 font-semibold">{selectedTime || "(select date first)"}</span>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full bg-white border rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange shadow-sm ${
                      errors.name ? "border-rose-500" : "border-slate-300"
                    }`}
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Work Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full bg-white border rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange shadow-sm ${
                      errors.email ? "border-rose-500" : "border-slate-300"
                    }`}
                    placeholder="john@company.com"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className={`w-full bg-white border rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange shadow-sm ${
                      errors.companyName ? "border-rose-500" : "border-slate-300"
                    }`}
                    placeholder="e.g. NextGen Manufacturing"
                  />
                </div>

                {/* Primary Topic Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Primary Discussion Topic *</label>
                  <select
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange shadow-sm cursor-pointer"
                  >
                    <option value="Executive Search & Advisory" className="text-slate-900 bg-white">Executive Search & Advisory</option>
                    <option value="Performance Training Academy" className="text-slate-900 bg-white">Performance Training Academy</option>
                    <option value="Operational Process Consulting" className="text-slate-900 bg-white">Operational Process Consulting</option>
                    <option value="Other Corporate Inquiry" className="text-slate-900 bg-white">Other Corporate Inquiry</option>
                  </select>
                </div>

                {submitError && (
                  <div className="text-rose-700 text-xs bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-center font-medium animate-fade-in">
                    {submitError}
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      isSubmitting
                        ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-brand-orange hover:bg-brand-orange-hover cursor-pointer shadow-md"
                    }`}
                  >
                    <span>{isSubmitting ? "Confirming Booking Slot..." : "Confirm Booking Slot"}</span>
                    {!isSubmitting && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>

              </form>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
