"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { getDocument } from "@/lib/services/firestoreService";
import {
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  Award,
  User,
  HelpCircle,
  Users,
  Sliders,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Loader2,
  ChevronRight,
  Shield,
  AlertOctagon
} from "lucide-react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [checkingSuspension, setCheckingSuspension] = useState(true);

  const isAuthPage = pathname === "/portal/login" || pathname === "/portal/register";

  // Check suspension status dynamically from Firestore users collection
  useEffect(() => {
    async function checkSuspension() {
      if (!user) {
        setCheckingSuspension(false);
        return;
      }
      try {
        const profile = await getDocument("users", user.uid);
        if (profile && profile.suspended === true) {
          setIsSuspended(true);
        } else {
          setIsSuspended(false);
        }
      } catch (err) {
        console.error("Error checking user suspension:", err);
      } finally {
        setCheckingSuspension(false);
      }
    }

    if (user && !isAuthPage) {
      checkSuspension();
    } else {
      setCheckingSuspension(false);
    }
  }, [user, pathname, isAuthPage]);

  // Route protection
  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.replace("/portal/login");
    }
  }, [user, loading, isAuthPage, router]);

  // Close mobile drawer on path change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  // Loading state
  if (loading || checkingSuspension || (!user && !isAuthPage)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-portal-bg text-portal-text-primary">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 border-4 border-portal-primary border-t-transparent rounded-full animate-spin mx-auto text-portal-primary" />
          <p className="text-portal-text-secondary text-sm tracking-wide">Syncing account profile...</p>
        </div>
      </div>
    );
  }

  // Account Suspended Screen
  if (isSuspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-portal-bg text-portal-text-primary p-6">
        <div className="max-w-md w-full bg-portal-card border border-portal-border rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500"></div>
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto animate-bounce">
            <AlertOctagon className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">Account Suspended</h2>
            <p className="text-sm text-portal-text-secondary leading-relaxed">
              Your NextGen Academy access has been suspended by the administrator. If you believe this is an error, please contact support.
            </p>
          </div>

          <div className="bg-slate-950 p-4.5 rounded-2xl border border-portal-border/60 text-xs text-left text-portal-text-secondary space-y-2">
            <p><span className="font-semibold text-white">Reason:</span> Violation of Terms of Service / Admin Suspension</p>
            <p><span className="font-semibold text-white">Support Email:</span> info@nextgen-consulting.com</p>
          </div>

          <button
            onClick={async () => {
              await logout();
              router.replace("/portal/login");
            }}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-portal-border text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Return to Login</span>
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Sidebar menus definition
  const generalMenuItems = [
    { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    { name: "Resources", href: "/portal/resources", icon: FolderOpen },
    { name: "Courses", href: "/portal/courses", icon: BookOpen },
    { name: "Certificates", href: "/portal/certificates", icon: Award },
    { name: "Profile", href: "/portal/profile", icon: User },
    { name: "Support", href: "/portal/support", icon: HelpCircle },
  ];

  const adminMenuItems = [
    { name: "Users", href: "/portal/admin/users", icon: Users },
    { name: "Course Manager", href: "/portal/admin/courses", icon: Sliders },
    { name: "Resource Manager", href: "/portal/admin/resources", icon: FileText },
    { name: "Analytics", href: "/portal/admin/analytics", icon: BarChart3 },
    { name: "Settings", href: "/portal/admin/settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    await logout();
    router.replace("/portal/login");
  };

  const formattedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-portal-sidebar border-r border-portal-border/60 text-portal-text-primary">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-20 border-b border-portal-border/40 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-portal-primary to-portal-secondary flex items-center justify-center font-bold text-xl text-white shadow-md">
          N
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-md tracking-tight text-white leading-none">NextGen Academy</span>
          <span className="text-[10px] text-portal-secondary font-semibold uppercase tracking-wider mt-1 leading-none">Enterprise LMS</span>
        </div>
      </div>

      {/* Nav List Wrapper */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* General learning segment */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-portal-text-secondary px-3 mb-2">Learning Hub</p>
          {generalMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/portal/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-portal-primary/10 text-white border border-portal-primary/20 shadow-sm"
                    : "text-portal-text-secondary hover:bg-slate-800/40 hover:text-white hover:translate-x-1"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 transition-colors ${isActive ? "text-portal-primary" : "text-portal-text-secondary group-hover:text-white"}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-portal-primary animate-pulse" />}
              </Link>
            );
          })}
        </div>

        {/* Admin only segment */}
        {user.role === "admin" && (
          <div className="space-y-1.5 pt-2 border-t border-portal-border/30">
            <p className="text-[10px] font-bold uppercase tracking-widest text-portal-text-secondary px-3 mb-2">Management</p>
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-4.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-portal-primary/10 text-white border border-portal-primary/20 shadow-sm"
                      : "text-portal-text-secondary hover:bg-slate-800/40 hover:text-white hover:translate-x-1"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 transition-colors ${isActive ? "text-portal-primary" : "text-portal-text-secondary group-hover:text-white"}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-portal-primary animate-pulse" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* User Footer Profile Block */}
      <div className="p-4 border-t border-portal-border/45 bg-slate-950/20 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4 px-2">
          {/* Avatar Icon */}
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-portal-border/80 flex items-center justify-center font-bold text-white text-md shadow-sm">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate leading-tight">{user.fullName}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                user.role === "admin"
                  ? "bg-portal-primary/10 border-portal-primary/20 text-portal-primary"
                  : user.role === "paid"
                  ? "bg-portal-secondary/10 border-portal-secondary/20 text-portal-secondary"
                  : "bg-portal-success/10 border-portal-success/20 text-portal-success"
              }`}>
                {user.role}
              </span>
              <span className="text-[9px] text-portal-text-secondary truncate">
                {user.role === "admin" ? "Admin Access" : user.role === "paid" ? "Premium Tier" : "Free Member"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border border-portal-border hover:border-red-500/30 bg-slate-900/40 hover:bg-red-500/10 text-xs font-semibold text-portal-text-secondary hover:text-red-400 transition-all duration-300 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-portal-bg text-portal-text-primary flex font-sans">
      {/* Desktop Sidebar (Fixed 280px) */}
      <aside className="hidden lg:block w-[280px] fixed inset-y-0 left-0 z-20 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Top Navbar Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-portal-sidebar border-b border-portal-border/40 px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-portal-primary to-portal-secondary flex items-center justify-center font-bold text-md text-white">
            N
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">NextGen Portal</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-portal-text-secondary hover:text-white hover:bg-slate-800"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          ></div>
          <aside className="fixed inset-y-0 left-0 w-[280px] bg-portal-sidebar z-50 lg:hidden shadow-2xl transition-transform duration-300 ease-in-out">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main Content Area: padding left 280px on desktop */}
      <div className="flex-1 lg:pl-[280px] flex flex-col min-h-screen">
        <main className="flex-grow p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 bg-portal-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
