"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments } from "@/lib/services/firestoreService";
import {
  BarChart3,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  FileDown,
  Clock,
  ArrowLeft,
  Loader2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingDown,
  CreditCard,
  FileText
} from "lucide-react";

interface UserProfile {
  role: string;
  suspended?: boolean;
}

interface Course {
  id: string;
  title: string;
  category: string;
  lessonsCount?: number;
}

interface Enrollment {
  userId: string;
  courseId: string;
  progress: number;
  completed: boolean;
}

interface AuditLog {
  action: string;
  adminEmail: string;
  details: string;
  timestamp: string;
}

export default function AdminAnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Metrics
  const [totalUsers, setTotalUsers] = useState(0);
  const [paidUsers, setPaidUsers] = useState(0);
  const [freeUsers, setFreeUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [completionsCount, setCompletionsCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [resourcesCount, setResourcesCount] = useState(0);
  const [certificatesCount, setCertificatesCount] = useState(0);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Access check
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/portal/login");
      } else if (user.role !== "admin") {
        router.replace("/portal/dashboard");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user || user.role !== "admin") return;
      try {
        setLoadingData(true);

        const [usersList, coursesList, enrollList, logsList, paymentsList, resourcesList, certsList] = await Promise.all([
          queryDocuments("users") as Promise<UserProfile[]>,
          queryDocuments("courses") as Promise<Course[]>,
          queryDocuments("enrollments") as Promise<Enrollment[]>,
          queryDocuments("audit_logs") as Promise<AuditLog[]>,
          queryDocuments("payments") as Promise<any[]>,
          queryDocuments("resources") as Promise<any[]>,
          queryDocuments("certificates") as Promise<any[]>
        ]);

        // Calculate counts
        setTotalUsers(usersList.length);
        const paid = usersList.filter(u => u.role === "paid").length;
        const admins = usersList.filter(u => u.role === "admin").length;
        setPaidUsers(paid + admins);
        setFreeUsers(usersList.filter(u => u.role === "free").length);
        setActiveUsers(usersList.filter(u => !u.suspended).length);
        setTotalCourses(coursesList.length);

        // Completions count
        const completed = enrollList.filter(e => e.completed === true || e.progress === 100).length;
        setCompletionsCount(completed);

        // Live revenue calculation from payments where status is success
        const successfulPayments = paymentsList.filter(p => p.status === "success");
        const rev = successfulPayments.reduce((sum, p) => sum + (p.amount || 0) / 100, 0);
        setTotalRevenue(rev);

        // Resources count
        setResourcesCount(resourcesList.length);

        // Certificates issued
        setCertificatesCount(certsList.length);

        // Recent Audit logs
        logsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentLogs(logsList.slice(0, 5));

      } catch (err) {
        console.error("Error loading analytics metrics:", err);
      } finally {
        setLoadingData(false);
      }
    }
    fetchAnalytics();
  }, [user]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Back button */}
      <div>
        <Link
          href="/portal/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-portal-text-secondary hover:text-portal-primary transition-colors duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Console</span>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-portal-border/60 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-portal-primary" />
          <span>Platform Analytics</span>
        </h1>
        <p className="text-sm text-portal-text-secondary mt-1">Monitor monthly subscription growth, track course completion statistics, and view action logs.</p>
      </div>

      {loadingData ? (
        <div className="min-h-[50vh] flex items-center justify-center bg-portal-bg text-portal-text-primary">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 border-4 border-portal-primary border-t-transparent rounded-full animate-spin mx-auto text-portal-primary" />
            <p className="text-portal-text-secondary text-sm tracking-wide">Aggregating platform audit metrics...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Metrics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KPI 1: Subscribers */}
            <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-portal-text-secondary uppercase tracking-wider">Total Subscribers</p>
                  <p className="text-3xl font-extrabold text-white">{totalUsers}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-portal-primary/10 border border-portal-primary/20 text-portal-primary">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] text-portal-success font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Active User Directories</span>
              </div>
            </div>

            {/* KPI 2: Sales Revenue */}
            <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-portal-text-secondary uppercase tracking-wider">Net Sales Revenue</p>
                  <p className="text-3xl font-extrabold text-white">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-portal-success/10 border border-portal-success/20 text-portal-success">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] text-portal-success font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Live payment database</span>
              </div>
            </div>

            {/* KPI 3: Certificates Issued */}
            <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-portal-text-secondary uppercase tracking-wider">Certificates Issued</p>
                  <p className="text-3xl font-extrabold text-white">{certificatesCount}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-portal-warning/10 border border-portal-warning/20 text-portal-warning">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] text-portal-success font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Verified credentials online</span>
              </div>
            </div>

            {/* KPI 4: Resources Published */}
            <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-portal-text-secondary uppercase tracking-wider">Resources Catalogued</p>
                  <p className="text-3xl font-extrabold text-white">{resourcesCount}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3.5 text-[10px] text-portal-text-secondary font-bold">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Cheat sheets & operational guides</span>
              </div>
            </div>
          </div>

          {/* Graphical charts mockup using raw pure CSS/SVGs for compatibility */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-portal-card border border-portal-border/60 space-y-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-portal-border/40 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary">Subscribers Registration Growth</h3>
                <span className="text-[10px] font-bold text-portal-primary uppercase">Year 2026</span>
              </div>

              {/* Pure SVG Bar chart */}
              <div className="h-64 flex items-end justify-between gap-4 pt-4 px-2 font-mono text-[9px] text-portal-text-secondary">
                {[
                  { month: "Jan", val: Math.round(totalUsers * 0.2) + 1 },
                  { month: "Feb", val: Math.round(totalUsers * 0.4) + 1 },
                  { month: "Mar", val: Math.round(totalUsers * 0.6) + 1 },
                  { month: "Apr", val: Math.round(totalUsers * 0.7) + 1 },
                  { month: "May", val: Math.round(totalUsers * 0.9) + 1 },
                  { month: "Jun", val: totalUsers }
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-150">{item.val}</span>
                    <div
                      className="w-full bg-gradient-to-t from-portal-primary/60 to-portal-primary hover:to-portal-secondary rounded-lg transition-all duration-500 shadow-md group-hover:scale-x-105"
                      style={{ height: `${(item.val / (totalUsers || 1)) * 90 + 10}%` }}
                    ></div>
                    <span className="mt-1 font-bold">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 space-y-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-portal-border/40 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary">Subscribers Breakdown</h3>
              </div>

              {/* Donut representation */}
              <div className="relative h-48 flex items-center justify-center">
                <svg className="w-36 h-36 transform -rotate-90">
                  {/* Outer circle */}
                  <circle
                    cx="72"
                    cy="72"
                    r="55"
                    className="stroke-slate-950 fill-transparent"
                    strokeWidth="16"
                  />
                  {/* Paid portion */}
                  <circle
                    cx="72"
                    cy="72"
                    r="55"
                    className="stroke-portal-primary fill-transparent transition-all duration-1000"
                    strokeWidth="16"
                    strokeDasharray={`${2 * Math.PI * 55}`}
                    strokeDashoffset={`${2 * Math.PI * 55 * (1 - (paidUsers / (totalUsers || 1)))}`}
                  />
                </svg>

                <div className="absolute text-center space-y-0.5">
                  <p className="text-[10px] font-bold text-portal-text-secondary uppercase">Paid users</p>
                  <p className="text-xl font-extrabold text-white">
                    {totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-6 text-[10px] font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-portal-primary"></span>
                  <span className="text-slate-300">Paid/Admin: {paidUsers}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-950 border border-portal-border"></span>
                  <span className="text-slate-300">Free: {freeUsers}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action audit logs trail snippet */}
          <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary border-b border-portal-border/40 pb-3">
              Action Audit Trail (Audit Logs Collection)
            </h3>

            <div className="divide-y divide-portal-border/30">
              {recentLogs.length === 0 ? (
                <p className="p-6 text-xs text-portal-text-secondary italic text-center">No platform audit logs generated yet.</p>
              ) : (
                recentLogs.map((log, idx) => (
                  <div key={idx} className="py-3 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase tracking-wider px-2 py-0.5 rounded text-[8px] bg-slate-900 border border-portal-border/50 text-portal-secondary">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-portal-text-secondary font-mono">@{log.adminEmail}</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-normal">{log.details}</p>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-portal-text-secondary font-semibold whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
