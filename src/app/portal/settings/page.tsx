"use client";

import React, { useState } from "react";
import {
  Bell,
  Lock,
  CheckCircle2,
  Palette
} from "lucide-react";

export default function SettingsPage() {
  const [isSaved, setIsSaved] = useState(false);
  const [theme, setTheme] = useState("slate");

  const [toggles, setToggles] = useState({
    courseAlerts: true,
    weeklyUpdates: false,
    mfa: false,
    publicProfile: true,
  });

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">Platform Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Customize your platform experience, adjust notifications, and configure privacy integrations.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {isSaved && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>Platform preferences saved successfully!</span>
          </div>
        )}

        {/* Section 1: Notifications */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bell className="w-4.5 h-4.5 text-portal-primary" />
            <span>Communications & Alerts</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Course Alerts</h4>
                <p className="text-xs text-slate-500 mt-0.5">Receive instant email updates when new syllabus lessons are published.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("courseAlerts")}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  toggles.courseAlerts ? "bg-portal-primary" : "bg-slate-200 border-slate-300"
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  toggles.courseAlerts ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            <div className="border-t border-slate-100 my-3"></div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Weekly Highlights</h4>
                <p className="text-xs text-slate-500 mt-0.5">Opt-in to get weekly digests of live webinars and consulting highlights.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("weeklyUpdates")}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  toggles.weeklyUpdates ? "bg-portal-primary" : "bg-slate-200 border-slate-300"
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  toggles.weeklyUpdates ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Security & Privacy */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-4.5 h-4.5 text-amber-500" />
            <span>Security & Visibility</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Two-Factor Authentication (MFA)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Enforce SMS/OTP verification at login to secure your directory folders.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("mfa")}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  toggles.mfa ? "bg-portal-primary" : "bg-slate-200 border-slate-300"
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  toggles.mfa ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            <div className="border-t border-slate-100 my-3"></div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Public Directory Listing</h4>
                <p className="text-xs text-slate-500 mt-0.5">Allow other enterprise members to find and network with your profile.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("publicProfile")}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  toggles.publicProfile ? "bg-portal-primary" : "bg-slate-200 border-slate-300"
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  toggles.publicProfile ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Visual Theme */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Palette className="w-4.5 h-4.5 text-portal-secondary" />
            <span>Visual Theme Workspace</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: "slate", label: "Enterprise Slate", desc: "Slate 900 background with active professional blue accents." },
              { id: "coal", label: "Midnight Obsidian", desc: "Deep dark backgrounds optimized for low light reading." },
              { id: "indigo", label: "Cosmic Indigo", desc: "Sleek dark violet palettes matching consulting interfaces." }
            ].map((t) => (
              <div
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-4.5 rounded-2xl border transition-all cursor-pointer ${
                  theme === t.id
                    ? "border-portal-primary bg-blue-50/50"
                    : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                }`}
              >
                <h4 className="text-xs font-bold text-slate-900">{t.label}</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
