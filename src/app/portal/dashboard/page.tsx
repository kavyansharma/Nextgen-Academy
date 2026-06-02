"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments } from "@/lib/services/firestoreService";
import { resources } from "@/data/resources";
import {
  Sparkles,
  BookOpen,
  FolderOpen,
  Award,
  Shield,
  Activity,
  ArrowRight,
  TrendingUp,
  Clock
} from "lucide-react";

interface CourseProgress {
  courseId: string;
  progressPercentage: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      try {
        // Query progress from Firestore
        const progressList = await queryDocuments("course_progress") as CourseProgress[];
        const userProgressList = progressList.filter(p => p.courseId && p.progressPercentage !== undefined); // Simple filter for safety

        // Since queryDocuments fetches all, we filter in memory for simplicity or check courseId
        // Wait, let's filter by current user
        // But wait! Can we filter using queryConstraints?
        // Yes, but filtering in memory is safe and fast for this scale.
        // Let's filter user's progress
        const myProgress = progressList.filter((p: any) => p.userId === user.uid);
        
        setEnrolledCount(myProgress.length);
        setCompletedCount(myProgress.filter((p: any) => p.progressPercentage === 100).length);

        // Fetch courses list to map titles
        const dbCourses = await queryDocuments("courses");
        const mappedRecent = myProgress.slice(0, 2).map((progress: any) => {
          const course = dbCourses.find((c: any) => c.id === progress.courseId);
          return {
            id: progress.courseId,
            title: course?.title || "Unknown Course",
            progressPercentage: progress.progressPercentage,
            category: course?.category || "General",
            type: course?.type || "free"
          };
        });
        setRecentCourses(mappedRecent);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (!user) return null;

  const formattedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  // Accessible resources count
  const accessibleResourcesCount = resources.filter(res => {
    if (user.role === "admin") return true;
    if (user.role === "paid") return res.type === "free" || res.type === "paid";
    return res.type === "free";
  }).length;

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl overflow-hidden group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-portal-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-portal-primary/15 transition-all duration-700"></div>
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-portal-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-portal-primary to-portal-secondary flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-portal-primary/20">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Welcome, {user.fullName}</h1>
                <Sparkles className="w-5.5 h-5.5 text-portal-warning animate-pulse" />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1.5 text-xs text-portal-text-secondary">
                <span>@{user.username}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Last login: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-4.5 py-2 rounded-full border text-xs font-bold shadow-sm uppercase tracking-wider ${
              user.role === "admin"
                ? "bg-portal-primary/10 border-portal-primary/30 text-portal-primary"
                : user.role === "paid"
                ? "bg-portal-secondary/10 border-portal-secondary/30 text-portal-secondary"
                : "bg-portal-success/10 border-portal-success/30 text-portal-success"
            }`}>
              <Shield className="w-3.5 h-3.5" />
              <span>{formattedRole} Access</span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Resources Available */}
        <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md hover:border-portal-primary/40 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold text-portal-text-secondary uppercase tracking-wider">Resources Available</p>
              <p className="text-3xl font-extrabold text-white">{accessibleResourcesCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-portal-border/80 text-portal-secondary group-hover:scale-110 transition-transform">
              <FolderOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-portal-secondary font-semibold">
            <Link href="/portal/resources" className="hover:underline flex items-center gap-1">
              <span>View files directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* KPI 2: Courses Enrolled */}
        <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md hover:border-portal-primary/40 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold text-portal-text-secondary uppercase tracking-wider">Courses Enrolled</p>
              <p className="text-3xl font-extrabold text-white">
                {loadingStats ? (
                  <span className="inline-block w-8 h-6 bg-slate-800 animate-pulse rounded"></span>
                ) : (
                  enrolledCount
                )}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-portal-border/80 text-portal-primary group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-portal-primary font-semibold">
            <Link href="/portal/courses" className="hover:underline flex items-center gap-1">
              <span>Launch courses catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* KPI 3: Certificates Earned */}
        <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md hover:border-portal-primary/40 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold text-portal-text-secondary uppercase tracking-wider">Certificates Earned</p>
              <p className="text-3xl font-extrabold text-white">
                {loadingStats ? (
                  <span className="inline-block w-8 h-6 bg-slate-800 animate-pulse rounded"></span>
                ) : (
                  completedCount
                )}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-portal-border/80 text-portal-warning group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-portal-warning font-semibold">
            <Link href="/portal/certificates" className="hover:underline flex items-center gap-1">
              <span>View credentials</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* KPI 4: Account Status */}
        <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md hover:border-portal-primary/40 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold text-portal-text-secondary uppercase tracking-wider">Account Status</p>
              <p className="text-2xl font-extrabold text-white">{formattedRole}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-portal-border/80 text-portal-success group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4.5 text-xs text-portal-success font-semibold">
            <span className="flex items-center gap-1 text-[10px] tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-portal-success animate-ping"></span>
              Active Account Status
            </span>
          </div>
        </div>
      </div>

      {/* Main Sections: Recent Learning & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Learning Progress */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-portal-primary" />
              <span>Continue Learning</span>
            </h2>
            <Link href="/portal/courses" className="text-xs text-portal-primary hover:underline font-semibold flex items-center gap-1">
              <span>See All Courses</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loadingStats ? (
            <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 text-center space-y-4">
              <div className="w-8 h-8 border-4 border-portal-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-portal-text-secondary">Loading your progress...</p>
            </div>
          ) : recentCourses.length === 0 ? (
            <div className="p-8 rounded-2xl bg-portal-card border border-portal-border/60 text-center space-y-4">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <div>
                <p className="font-bold text-white">No active course enrollments</p>
                <p className="text-xs text-portal-text-secondary mt-1">Explore our professional training catalog to start learning.</p>
              </div>
              <Link
                href="/portal/courses"
                className="inline-flex px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-xs font-bold text-white transition-all shadow-md"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCourses.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl bg-portal-card border border-portal-border/60 hover:border-slate-700 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-portal-secondary px-2.5 py-0.5 rounded-full bg-slate-900 border border-portal-border/50">
                      {c.category}
                    </span>
                    <h3 className="font-bold text-white text-md pt-1">{c.title}</h3>
                    <p className="text-xs text-portal-text-secondary">{c.type === "free" ? "Free Course" : "Premium Certification"}</p>
                  </div>

                  <div className="w-full sm:w-48 space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-portal-text-secondary">Progress</span>
                      <span className="text-white">{c.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                      <div className="h-full bg-gradient-to-r from-portal-primary to-portal-secondary rounded-full" style={{ width: `${c.progressPercentage}%` }}></div>
                    </div>
                  </div>

                  <Link
                    href={`/portal/courses/${c.id}`}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-portal-border hover:border-portal-primary text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer self-stretch sm:self-auto text-center"
                  >
                    Resume
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Platform Updates / Bulletins */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-portal-warning" />
            <span>Weekly Highlights</span>
          </h2>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-portal-card to-slate-950 border border-portal-border/60 space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2.5 rounded-xl bg-portal-warning/10 border border-portal-warning/20 text-portal-warning flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Premium Webinar</h4>
                <p className="text-xs text-portal-text-secondary leading-relaxed">
                  Join our live consulting webinar on "Digital Twin Implementation" this Thursday at 4 PM IST.
                </p>
              </div>
            </div>

            <div className="border-t border-portal-border/40 my-3"></div>

            <div className="flex gap-4 items-start">
              <div className="p-2.5 rounded-xl bg-portal-secondary/10 border border-portal-secondary/20 text-portal-secondary flex-shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Interview Preparation</h4>
                <p className="text-xs text-portal-text-secondary leading-relaxed">
                  Elevate your recruitment success with mock practice templates now available under the Support directory.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
