"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { 
  LogOut, 
  User, 
  Shield, 
  FolderLock, 
  Sparkles,
  Mail,
  Calendar,
  Activity,
  FolderOpen,
  Settings
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Route protection check
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/portal/login");
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await logout();
    router.replace("/portal/login");
  };

  if (loading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-brand-dark">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-brand-text-muted text-sm tracking-wide">Securing connection...</p>
        </div>
      </div>
    );
  }

  // Capitalize the first letter of the role
  const formattedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return (
    <div className="relative min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 bg-brand-dark overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto z-10 relative space-y-8 animate-fade-in">
        
        {/* Welcome Banner */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/5 shadow-2xl glass flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-orange to-brand-blue flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-orange/10">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Welcome, {user.fullName}</h1>
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <p className="text-sm text-brand-text-muted mt-1">Logged in as <span className="text-slate-300 font-semibold">@{user.username}</span></p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-950/60 hover:bg-slate-900 hover:border-brand-orange text-sm font-semibold text-slate-300 hover:text-white transition-all duration-300 hover:scale-[1.02] cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-brand-orange" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Profile Card & Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main User Card */}
          <div className="md:col-span-1 p-6 rounded-2xl bg-brand-dark-light border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-orange" />
                <span>Account Profile</span>
              </h3>
              
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Mail className="w-4.5 h-4.5 text-brand-blue flex-shrink-0" />
                  <span className="truncate" title={user.email}>{user.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Calendar className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />
                  <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 my-2 pt-4 flex items-center justify-between">
              <span className="text-xs text-brand-text-muted">Subscription Status</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-semibold">
                <Shield className="w-3 h-3" />
                <span>{formattedRole} User</span>
              </span>
            </div>
          </div>

          {/* Main Hub Section */}
          <div className="md:col-span-2 p-8 rounded-2xl bg-slate-900/60 border border-slate-800 glass flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Portal Hub</span>
                </h3>
                <h2 className="text-xl font-bold text-white">Learning & Consulting Center</h2>
                <p className="text-sm text-brand-text-muted leading-relaxed">
                  Welcome back! Access your training materials and consulting resources below.
                </p>
              </div>

              {/* Action Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resources Button/Card */}
                <Link 
                  href="/portal/resources"
                  className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-brand-orange hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-lg bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white group-hover:text-brand-orange transition-colors">Academy Resources</h3>
                    <p className="text-xs text-brand-text-muted">Access training guides, files, and resources.</p>
                  </div>
                  <span className="text-xs font-semibold text-brand-orange flex items-center gap-1">
                    Open Directory &rarr;
                  </span>
                </Link>

                {/* Admin Dashboard Button/Card (Conditional) */}
                {user.role === "admin" && (
                  <Link 
                    href="/portal/admin"
                    className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-brand-blue hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue">
                        <Settings className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-white group-hover:text-brand-blue transition-colors">Admin Dashboard</h3>
                      <p className="text-xs text-brand-text-muted">Manage users, catalog items, and access levels.</p>
                    </div>
                    <span className="text-xs font-semibold text-brand-blue flex items-center gap-1">
                      Open Admin Panel &rarr;
                    </span>
                  </Link>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-4 text-sm text-slate-300">
              <FolderLock className="w-8 h-8 text-brand-orange flex-shrink-0" />
              <div>
                <span className="font-semibold text-white">Upcoming Features</span>
                <p className="text-xs text-brand-text-muted mt-0.5">Mock practice interviews, live training webinars, and feedback loops are coming soon.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
