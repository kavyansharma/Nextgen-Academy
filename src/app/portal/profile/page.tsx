"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);

  if (!user) return null;

  const formattedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  const handleMockSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="border-b border-portal-border/60 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Account Profile</h1>
        <p className="text-sm text-portal-text-secondary mt-1">Manage your professional identity, email preferences, and view membership details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: Overview card */}
        <div className="md:col-span-1 p-6 rounded-2xl bg-portal-card border border-portal-border/60 space-y-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-portal-primary to-portal-secondary flex items-center justify-center font-extrabold text-white text-3xl shadow-lg border border-portal-border/50 mx-auto">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            
            <div className="text-center space-y-1">
              <h2 className="font-extrabold text-lg text-white">{user.fullName}</h2>
              <p className="text-xs text-portal-text-secondary">@{user.username}</p>
            </div>

            <div className="border-t border-portal-border/40 my-3"></div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Mail className="w-4 h-4 text-portal-secondary flex-shrink-0" />
                <span className="truncate" title={user.email}>{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Calendar className="w-4 h-4 text-portal-success flex-shrink-0" />
                <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-portal-border/40 pt-4 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-portal-text-secondary tracking-wide">Subscription</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-portal-primary/10 border border-portal-primary/20 text-portal-primary text-[10px] font-bold uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              <span>{formattedRole} User</span>
            </span>
          </div>
        </div>

        {/* Right column: Edit Details Form */}
        <form onSubmit={handleMockSave} className="md:col-span-2 p-6 sm:p-8 rounded-2xl bg-portal-card border border-portal-border/60 space-y-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary flex items-center gap-2">
            <User className="w-4.5 h-4.5 text-portal-primary" />
            <span>Profile Information</span>
          </h3>

          {isSaved && (
            <div className="p-3.5 bg-portal-success/10 border border-portal-success/20 rounded-xl text-xs text-portal-success flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Profile information successfully updated! (Simulation)</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Full Name</label>
              <input
                type="text"
                defaultValue={user.fullName}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Username</label>
              <input
                type="text"
                defaultValue={user.username}
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-portal-text-secondary focus:outline-none text-sm cursor-not-allowed opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Email Address</label>
            <input
              type="email"
              defaultValue={user.email}
              disabled
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-portal-text-secondary focus:outline-none text-sm cursor-not-allowed opacity-60"
            />
          </div>

          <div className="border-t border-portal-border/40 my-2"></div>

          <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary flex items-center gap-2 pt-2">
            <Key className="w-4.5 h-4.5 text-portal-warning" />
            <span>Security Credentials</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Current Password</label>
              <input
                type="password"
                placeholder="********"
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-portal-text-secondary focus:outline-none text-sm cursor-not-allowed opacity-60"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">New Password</label>
              <input
                type="password"
                placeholder="Enter new password..."
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-portal-text-secondary focus:outline-none text-sm cursor-not-allowed opacity-60"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-portal-border/50 text-[10px] text-portal-text-secondary flex gap-2">
            <AlertCircle className="w-4 h-4 text-portal-warning flex-shrink-0" />
            <span>Password edits and credential changes are locked in demonstration modes. Contact portal support to modify your primary login method.</span>
          </div>

          <div className="pt-4 border-t border-portal-border/60 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
