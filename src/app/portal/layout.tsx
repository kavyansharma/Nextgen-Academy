"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { getDocument } from "@/lib/services/firestoreService";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  AlertOctagon,
  MessageSquare,
  Bell,
  Mail,
  Database,
  CreditCard,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "@/lib/context/ThemeContext";

interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt?: { toDate?: () => Date } | Date | string | null;
}

function getNotificationDate(createdAt: unknown): string {
  if (!createdAt) return "";
  if (typeof createdAt === "object" && "toDate" in createdAt) {
    const toDate = (createdAt as { toDate: () => unknown }).toDate;
    if (typeof toDate === "function") {
      const d = toDate();
      if (d instanceof Date) {
        return d.toLocaleDateString();
      }
    }
  }
  if (typeof createdAt === "string" || createdAt instanceof Date) {
    return new Date(createdAt as string | Date).toLocaleDateString();
  }
  return "";
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [checkingSuspension, setCheckingSuspension] = useState(true);
  
  // Notification states
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const isAuthPage = pathname === "/portal/login" || pathname === "/portal/register";

  const [subPlan, setSubPlan] = useState<string | null>(null);

  // Load subscription plan details
  useEffect(() => {
    async function fetchSub() {
      if (!user?.uid) return;
      try {
        const subDoc = await getDocument("subscriptions", user.uid);
        if (subDoc && subDoc.status === "active") {
          setSubPlan(subDoc.plan);
        } else {
          setSubPlan(null);
        }
      } catch (err) {
        console.error("Failed to load subscription in layout:", err);
      }
    }
    const run = async () => {
      await Promise.resolve();
      if (user?.uid && !isAuthPage) {
        fetchSub();
      }
    };
    run();
  }, [user, isAuthPage]);

  // Check suspension status dynamically from Firestore users collection
  useEffect(() => {
    async function checkSuspension() {
      if (!user?.uid) {
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

    const run = async () => {
      await Promise.resolve();
      if (user?.uid && !isAuthPage) {
        checkSuspension();
      } else {
        setCheckingSuspension(false);
      }
    };
    run();
  }, [user, pathname, isAuthPage]);

  // Real-time notifications listener
  useEffect(() => {
    if (!user?.uid || isAuthPage) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: NotificationItem[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as NotificationItem);
      });
      setNotifications(list);
    }, (error) => {
      console.error("Notifications snapshot error:", error);
    });

    return () => unsubscribe();
  }, [user, isAuthPage]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
    try {
      const docRef = doc(db, "notifications", id);
      await updateDoc(docRef, { read: true });
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unreadList = notifications.filter(n => !n.read);
      if (unreadList.length === 0) return;
      
      const batch = writeBatch(db);
      unreadList.forEach(n => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking all notifications read:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "certificate": return <Award className="w-4 h-4 text-amber-600" />;
      case "subscription": return <Shield className="w-4 h-4 text-blue-600" />;
      case "enrollment": return <Users className="w-4 h-4 text-blue-650" />;
      case "lesson": return <BookOpen className="w-4 h-4 text-emerald-650" />;
      case "resource": return <FolderOpen className="w-4 h-4 text-purple-650" />;
      default: return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  // Route protection
  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.replace("/portal/login");
    }
  }, [user, loading, isAuthPage, router]);

  // Close mobile drawer on path change
  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      setMobileOpen(false);
    };
    run();
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-md relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500"></div>
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-650 mx-auto animate-bounce">
            <AlertOctagon className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Account Suspended</h2>
            <p className="text-sm text-slate-650 leading-relaxed">
              Your NextGen Academy access has been suspended by the administrator. If you believe this is an error, please contact support.
            </p>
          </div>

          <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 text-xs text-left text-slate-600 space-y-2">
            <p><span className="font-semibold text-slate-900">Reason:</span> Violation of Terms of Service / Admin Suspension</p>
            <p><span className="font-semibold text-slate-900">Support Email:</span> info@nextgen-consulting.com</p>
          </div>

          <button
            onClick={async () => {
              await logout();
              router.replace("/portal/login");
            }}
            className="w-full py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Return to Login</span>
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  let subLabel = "FREE MEMBER";
  let badgeColor = "bg-slate-100 border-slate-200 text-slate-700";
  let subDesc = "Free Learning Tier";

  const userRole = user.role;

  if (userRole === "admin") {
    subLabel = "ADMIN ACCESS";
    badgeColor = "bg-blue-50 border-blue-200 text-blue-700";
    subDesc = "Admin Access";
  } else if (userRole === "paid" || subPlan) {
    if (subPlan === "premium_monthly") {
      subLabel = "PREMIUM MONTHLY";
      badgeColor = "bg-emerald-50 border-emerald-250 text-emerald-700";
      subDesc = "Monthly Subscription";
    } else if (subPlan === "premium_yearly" || subPlan === "premium") {
      subLabel = "PREMIUM YEARLY";
      badgeColor = "bg-emerald-50 border-emerald-250 text-emerald-700";
      subDesc = "Yearly Subscription";
    } else if (subPlan === "corporate") {
      subLabel = "CORPORATE";
      badgeColor = "bg-purple-50 border-purple-250 text-purple-700";
      subDesc = "Enterprise Tier";
    } else {
      subLabel = "PREMIUM MEMBER";
      badgeColor = "bg-emerald-50 border-emerald-250 text-emerald-700";
      subDesc = "Premium Tier";
    }
  } else {
    subLabel = "FREE MEMBER";
    badgeColor = "bg-slate-100 border-slate-200 text-slate-600";
    subDesc = "Free Member";
  }

  // Sidebar menus definition
  const generalMenuItems = [
    { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    { name: "Resources", href: "/portal/resources", icon: FolderOpen },
    { name: "Courses", href: "/portal/courses", icon: BookOpen },
    { name: "Certificates", href: "/portal/certificates", icon: Award },
    { name: "Community", href: "/portal/community", icon: MessageSquare },
    { name: "Support", href: "/portal/support", icon: HelpCircle },
    { name: "Profile", href: "/portal/profile", icon: User },
    {
      name: "Payment Details",
      href: "/portal/payments",
      icon: CreditCard,
      subtitle: "Plans, Payments & Invoices",
      isNew: true
    },
    { name: "Settings", href: "/portal/settings", icon: Settings },
  ];

  const adminMenuItems = [
    { name: "Admin Dashboard", href: "/portal/admin", icon: Shield },
    { name: "User Directory", href: "/portal/admin/users", icon: Users },
    { name: "Course Catalog", href: "/portal/admin/courses", icon: Sliders },
    { name: "Resource Manager", href: "/portal/admin/resources", icon: FileText },
    { name: "Subscription Desk", href: "/portal/admin/subscriptions", icon: Award },
    { name: "Support Tickets", href: "/portal/admin/support", icon: HelpCircle },
    { name: "Community Moderation", href: "/portal/admin/community", icon: MessageSquare },
    { name: "Analytics Ledger", href: "/portal/admin/analytics", icon: BarChart3 },
    { name: "Communications Hub", href: "/portal/admin/communications", icon: Mail },
    { name: "Backup Center", href: "/portal/admin/backups", icon: Database },
    { name: "Platform Settings", href: "/portal/admin/settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    await logout();
    router.replace("/portal/login");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-portal-sidebar border-r border-slate-200 text-slate-900">
      <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-150 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-xl text-white shadow-md">
          N
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-md tracking-tight text-slate-900 leading-none">NextGen Academy</span>
          <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider mt-1 leading-none">Enterprise LMS</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">Learning Hub</p>
          {generalMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/portal/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-50/70 text-blue-600 border border-blue-100 shadow-sm font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 transition-colors ${isActive ? "text-blue-650" : "text-slate-500 group-hover:text-slate-800"}`} />
                  {item.subtitle ? (
                    <div className="flex flex-col text-left">
                      <span className="leading-tight">{item.name}</span>
                      <span className="text-[9px] text-slate-400 group-hover:text-slate-500 transition-colors font-medium mt-0.5">{item.subtitle}</span>
                    </div>
                  ) : (
                    <span>{item.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.isNew && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-250 text-emerald-700 text-[8px] font-bold tracking-wider uppercase">NEW</span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />}
                </div>
              </Link>
            );
          })}
        </div>

        {user.role === "admin" && (
          <div className="space-y-1.5 pt-2 border-t border-slate-150">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">Management</p>
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-4.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-50/70 text-blue-600 border border-blue-100 shadow-sm font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 transition-colors ${isActive ? "text-blue-650" : "text-slate-500 group-hover:text-slate-800"}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-md shadow-sm">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate leading-tight">{user.fullName}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${badgeColor}`}>
                {subLabel}
              </span>
              <span className="text-[9px] text-slate-550 truncate">
                {subDesc}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200 hover:border-red-200 bg-white hover:bg-red-50 text-xs font-semibold text-slate-600 hover:text-red-650 transition-all duration-300 cursor-pointer shadow-sm"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  const notificationsDropdown = (
    <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 text-left animate-fade-in">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Notifications</span>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>
      
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkRead(notif.id)}
              className={`p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                !notif.read ? "bg-blue-50/30 hover:bg-blue-50/50" : "hover:bg-slate-50"
              }`}
            >
              <div className={`p-2 rounded-xl mt-0.5 flex-shrink-0 ${
                !notif.read ? "bg-white border border-slate-150 shadow-sm" : "bg-slate-100/50"
              }`}>
                {getNotificationIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-xs ${!notif.read ? "text-slate-900 font-bold" : "text-slate-650 font-medium"}`}>
                  {notif.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  {notif.message}
                </p>
                <span className="text-[9px] text-slate-400 font-mono mt-1 block">
                  {getNotificationDate(notif.createdAt)}
                </span>
              </div>
              {!notif.read && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      <aside className="hidden lg:block w-[280px] fixed inset-y-0 left-0 z-20 flex-shrink-0">
        {sidebarContent}
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-md text-white">
            N
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900">NextGen Portal</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-650 hover:text-slate-900 cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-605" />}
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-slate-650 hover:text-slate-900 cursor-pointer relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-45" onClick={() => setShowNotifications(false)} />
                <div className="relative z-50">
                  {notificationsDropdown}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-slate-650 hover:text-slate-900"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          ></div>
          <aside className="fixed inset-y-0 left-0 w-[280px] bg-portal-sidebar z-50 lg:hidden shadow-2xl transition-transform duration-300 ease-in-out">
            {sidebarContent}
          </aside>
        </>
      )}

      <div className="flex-1 lg:pl-[280px] flex flex-col min-h-screen">
        <header className="hidden lg:flex h-20 border-b border-slate-200 px-8 items-center justify-between bg-white sticky top-0 z-30 flex-shrink-0">
          <div className="text-xs text-slate-500">
            Console: <span className="font-bold text-slate-900 uppercase tracking-wider">{user.role} Tier</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-350 transition-all cursor-pointer relative shadow-sm animate-fade-in"
              title="Toggle Light/Dark Theme"
            >
              {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-slate-650" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-350 transition-all cursor-pointer relative shadow-sm"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-600 border-2 border-white rounded-full animate-pulse" />
                )}
              </button>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-45" onClick={() => setShowNotifications(false)} />
                  <div className="relative z-50">
                    {notificationsDropdown}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-grow p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
