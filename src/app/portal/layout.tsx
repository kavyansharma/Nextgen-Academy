"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  Award,
  User,
  Settings,
  HelpCircle,
  Shield,
  LogOut,
  Menu,
  X,
  Loader2,
  ChevronRight
} from "lucide-react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthPage = pathname === "/portal/login" || pathname === "/portal/register";

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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-portal-bg text-portal-text-primary">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 border-4 border-portal-primary border-t-transparent rounded-full animate-spin mx-auto text-portal-primary" />
          <p className="text-portal-text-secondary text-sm tracking-wide">Syncing account profile...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    { name: "Resources", href: "/portal/resources", icon: FolderOpen },
    { name: "Courses", href: "/portal/courses", icon: BookOpen },
    { name: "Certificates", href: "/portal/certificates", icon: Award },
    { name: "Profile", href: "/portal/profile", icon: User },
    { name: "Settings", href: "/portal/settings", icon: Settings },
    { name: "Support", href: "/portal/support", icon: HelpCircle },
  ];

  if (user.role === "admin") {
    menuItems.push({ name: "Admin Panel", href: "/portal/admin", icon: Shield });
  }

  const handleSignOut = async () => {
    await logout();
    router.replace("/portal/login");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-portal-sidebar border-r border-portal-border/60 text-portal-text-primary">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-20 border-b border-portal-border/40">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-portal-primary to-portal-secondary flex items-center justify-center font-bold text-xl text-white shadow-md">
          N
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-md tracking-tight text-white">NextGen Academy</span>
          <span className="text-[10px] text-portal-secondary font-semibold uppercase tracking-wider">Enterprise Hub</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
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
      </nav>

      {/* User Footer Profile & SignOut */}
      <div className="p-4 border-t border-portal-border/45 bg-slate-950/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white border border-portal-border/50">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
            <p className="text-[10px] text-portal-text-secondary capitalize font-semibold">{user.role} Member</p>
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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 fixed inset-y-0 left-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Top Navbar */}
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

      {/* Mobile Sidebar drawer overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          ></div>
          <aside className="fixed inset-y-0 left-0 w-64 bg-portal-sidebar z-50 lg:hidden shadow-2xl transition-transform duration-300 ease-in-out">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-grow p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 bg-portal-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
