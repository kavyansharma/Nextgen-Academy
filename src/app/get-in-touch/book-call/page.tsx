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

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
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

    setBookingFinished(true);
  };

  return (
    <div className="relative min-h-screen bg-brand-dark py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-brand-blue/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative space-y-8">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-brand-orange transition-colors duration-200">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Consultation Scheduler</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Book a Discovery Consultation
          </h1>
          <p className="text-sm text-brand-text-muted">
            Select an active business slot below to schedule a confidential 30-minute operational strategy audit or executive search briefing with a NextGen Senior Advisor.
          </p>
        </div>

        {/* Success Confirmation state */}
        {bookingFinished ? (
          <div className="bg-brand-dark-light border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-6 glass animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-extrabold text-white">Discovery Call Confirmed</h2>
              <p className="text-base text-slate-200">
                Scheduled for: <span className="text-brand-orange font-bold">{selectedDate}</span> at <span className="text-brand-orange font-bold">{selectedTime}</span>
              </p>
              <p className="text-sm text-brand-text-muted leading-relaxed max-w-lg mx-auto">
                A calendar invitation link containing MS Teams details has been sent to <span className="text-white font-semibold">{formData.email}</span>. A senior partner specialized in <span className="text-white font-semibold">{formData.topic}</span> will host the session.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 max-w-sm mx-auto">
              <Link 
                href="/"
                className="w-full inline-block py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-orange text-white text-sm font-semibold transition-all duration-300"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Step 1: Calendar and Time Slot select (Left column) */}
            <div className="lg:col-span-7 bg-brand-dark-light border border-slate-800 rounded-3xl p-6 space-y-6 glass">
              
              {/* Date Select */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
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
                          : "bg-slate-950 border-slate-850 text-slate-300 hover:border-brand-orange/45"
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
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
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
                            : "bg-slate-950 border-slate-850 text-slate-300 hover:border-brand-blue/45"
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
            <div className="lg:col-span-5 bg-brand-dark-light border border-slate-800 rounded-3xl p-6 glass">
              <form onSubmit={handleBook} className="space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-850 pb-2">
                  3. Session Details
                </h3>

                {/* Selected Slot summary */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 text-xs flex flex-col gap-1 text-brand-text-muted">
                  <div>
                    Date: <span className="text-white font-semibold">{selectedDate || "(select above)"}</span>
                  </div>
                  <div>
                    Time: <span className="text-white font-semibold">{selectedTime || "(select date first)"}</span>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-950 border rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-orange ${
                      errors.name ? "border-rose-500" : "border-slate-800"
                    }`}
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Work Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-950 border rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-orange ${
                      errors.email ? "border-rose-500" : "border-slate-800"
                    }`}
                    placeholder="john@company.com"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-950 border rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-orange ${
                      errors.companyName ? "border-rose-500" : "border-slate-800"
                    }`}
                    placeholder="e.g. NextGen Manufacturing"
                  />
                </div>

                {/* Primary Topic Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Discussion Topic *</label>
                  <select
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="Executive Search & Advisory">Executive Search & Advisory</option>
                    <option value="Performance Training Academy">Performance Training Academy</option>
                    <option value="Operational Process Consulting">Operational Process Consulting</option>
                    <option value="Other Corporate Inquiry">Other Corporate Inquiry</option>
                  </select>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Confirm Booking Slot</span>
                    <ChevronRight className="w-4 h-4" />
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
