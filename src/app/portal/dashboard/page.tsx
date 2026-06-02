"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments } from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";
import {
  Sparkles,
  BookOpen,
  FolderOpen,
  Award,
  Shield,
  Activity,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Bookmark,
  Loader2
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  type: "free" | "premium";
  duration?: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "free" | "paid";
  slug: string;
}

interface CourseProgressDoc {
  userId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  completedAt: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [completedCoursesCount, setCompletedCoursesCount] = useState(0);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      try {
        setLoading(true);

        const courseConstraints = (user.role === "admin" || user.role === "paid")
          ? []
          : [where("type", "==", "free")];

        const resourceConstraints = (user.role === "admin" || user.role === "paid")
          ? []
          : [where("accessLevel", "==", "free")];

        const progressConstraints = (user.role === "admin")
          ? []
          : [where("userId", "==", user.uid)];

        // Fetch courses, resources, and progress from Firestore
        const [dbCourses, dbResources, dbProgress] = await Promise.all([
          queryDocuments("courses", ...courseConstraints) as Promise<Course[]>,
          queryDocuments("resources", ...resourceConstraints) as Promise<Resource[]>,
          queryDocuments("course_progress", ...progressConstraints) as Promise<CourseProgressDoc[]>
        ]);

        setCoursesList(dbCourses);
        setResourcesList(dbResources);

        // Filter user progress
        const myProgress = dbProgress.filter(p => p.userId === user.uid && p.completed === true);
        
        // Group completions by courseId
        const progressByCourse: Record<string, string[]> = {};
        myProgress.forEach(p => {
          if (!progressByCourse[p.courseId]) {
            progressByCourse[p.courseId] = [];
          }
          if (!progressByCourse[p.courseId].includes(p.lessonId)) {
            progressByCourse[p.courseId].push(p.lessonId);
          }
        });

        // For each active course, fetch its lessons count to determine progress percentage
        const activeCoursesMapped: any[] = [];
        let completedCount = 0;

        for (const courseId of Object.keys(progressByCourse)) {
          const course = dbCourses.find(c => c.id === courseId);
          if (!course) continue;

          // Fetch lessons in subcollection courses/{courseId}/lessons
          const courseLessons = await queryDocuments(`courses/${courseId}/lessons`);
          const totalLessonsCount = courseLessons.length;
          
          if (totalLessonsCount > 0) {
            const completedCountForCourse = progressByCourse[courseId].length;
            const percentage = Math.round((completedCountForCourse / totalLessonsCount) * 100);

            if (percentage === 100) {
              completedCount++;
            }

            activeCoursesMapped.push({
              ...course,
              progressPercentage: percentage,
              completedCount: completedCountForCourse,
              totalCount: totalLessonsCount
            });
          }
        }

        setEnrolledCourses(activeCoursesMapped);
        setCompletedCoursesCount(completedCount);

        // Recommended Courses: Courses user hasn't completed or enrolled in yet (up to 2)
        const enrolledIds = Object.keys(progressByCourse);
        const unstarted = dbCourses.filter(c => !enrolledIds.includes(c.id));
        setRecommendedCourses(unstarted.slice(0, 2));

      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (!user) return null;

  const formattedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const subscriptionLabel = user.role === "admin" ? "Enterprise Administrator" : user.role === "paid" ? "Paid Premium Member" : "Free Learning Tier";

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Top Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl overflow-hidden group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-portal-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-portal-primary/15 transition-all duration-700"></div>
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-portal-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-portal-primary to-portal-secondary flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-portal-primary/25 border border-portal-border/40">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Welcome, {user.fullName}</h1>
                <Sparkles className="w-5.5 h-5.5 text-portal-warning animate-pulse" />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1.5 text-xs text-portal-text-secondary">
                <span className="font-semibold text-slate-300">@{user.username}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                <span>System Role: <span className="font-semibold text-portal-secondary">{formattedRole}</span></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Last login: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-full border border-portal-primary/30 bg-portal-primary/10 text-portal-primary text-xs font-bold shadow-sm uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              <span>{subscriptionLabel}</span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Resources Available */}
        <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md hover:border-portal-primary/40 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold text-portal-text-secondary uppercase tracking-wider">Resources Available</p>
              <p className="text-3xl font-extrabold text-white">
                {loading ? (
                  <span className="inline-block w-8 h-8 bg-slate-800 animate-pulse rounded"></span>
                ) : (
                  resourcesList.length
                )}
              </p>
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
                {loading ? (
                  <span className="inline-block w-8 h-8 bg-slate-800 animate-pulse rounded"></span>
                ) : (
                  enrolledCourses.length
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

        {/* KPI 3: Courses Completed */}
        <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md hover:border-portal-primary/40 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold text-portal-text-secondary uppercase tracking-wider">Courses Completed</p>
              <p className="text-3xl font-extrabold text-white">
                {loading ? (
                  <span className="inline-block w-8 h-8 bg-slate-800 animate-pulse rounded"></span>
                ) : (
                  completedCoursesCount
                )}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-portal-border/80 text-portal-success group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-portal-success font-semibold">
            <span className="flex items-center gap-1 text-[10px] tracking-wide uppercase">
              Full LMS Completions
            </span>
          </div>
        </div>

        {/* KPI 4: Certificates Earned */}
        <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md hover:border-portal-primary/40 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold text-portal-text-secondary uppercase tracking-wider">Certificates Earned</p>
              <p className="text-3xl font-extrabold text-white">
                {loading ? (
                  <span className="inline-block w-8 h-8 bg-slate-800 animate-pulse rounded"></span>
                ) : (
                  completedCoursesCount
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
      </div>

      {/* Grid Layouts below stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Learning activities */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section: Continue Learning */}
          <div className="space-y-4">
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

            {loading ? (
              <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-portal-primary mb-2" />
                <p className="text-xs text-portal-text-secondary">Syncing learning timeline...</p>
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div className="p-8 rounded-2xl bg-portal-card border border-portal-border/60 text-center space-y-4 shadow-sm">
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
              <div className="space-y-3">
                {enrolledCourses.map((c) => (
                  <div key={c.id} className="p-5 rounded-2xl bg-portal-card border border-portal-border/60 hover:border-slate-700 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-portal-secondary px-2.5 py-0.5 rounded-full bg-slate-900 border border-portal-border/50">
                        {c.category}
                      </span>
                      <h3 className="font-bold text-white text-md pt-1">{c.title}</h3>
                      <p className="text-xs text-portal-text-secondary">Progress: {c.completedCount} of {c.totalCount} modules completed</p>
                    </div>

                    <div className="w-full sm:w-48 space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-portal-text-secondary">Completions</span>
                        <span className="text-white">{c.progressPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div className="h-full bg-gradient-to-r from-portal-primary to-portal-secondary rounded-full" style={{ width: `${c.progressPercentage}%` }}></div>
                      </div>
                    </div>

                    <Link
                      href={`/portal/courses/${c.id}`}
                      className="px-4.5 py-2.5 rounded-xl bg-slate-900 border border-portal-border hover:border-portal-primary text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer self-stretch sm:self-auto text-center"
                    >
                      Resume
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Recommended Courses */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-portal-secondary" />
              <span>Recommended Courses</span>
            </h2>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="h-44 rounded-2xl bg-portal-card border border-portal-border/60 animate-pulse"></div>
                ))}
              </div>
            ) : recommendedCourses.length === 0 ? (
              <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 text-center text-xs text-portal-text-secondary">
                <span>You are currently enrolled in all of our active courses!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {recommendedCourses.map((c) => (
                  <div key={c.id} className="p-5 rounded-2xl bg-portal-card border border-portal-border/60 hover:border-portal-primary/30 flex flex-col justify-between h-44 shadow-sm group">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-900 text-portal-secondary border border-portal-border/50">
                          {c.category}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          c.type === "free" ? "bg-portal-success/10 border-portal-success/20 text-portal-success" : "bg-portal-warning/10 border-portal-warning/20 text-portal-warning"
                        }`}>
                          {c.type}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-portal-primary transition-colors">{c.title}</h3>
                      <p className="text-xs text-portal-text-secondary line-clamp-2 leading-relaxed">{c.description}</p>
                    </div>

                    <div className="pt-3 border-t border-portal-border/40 flex justify-end">
                      <Link
                        href="/portal/courses"
                        className="text-xs font-bold text-portal-primary hover:underline flex items-center gap-1"
                      >
                        <span>Enroll Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Recent Resources & Platform bulletins */}
        <div className="space-y-8">
          
          {/* Section: Recent Resources */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-portal-secondary" />
              <span>Recent Resources</span>
            </h2>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-portal-card border border-portal-border/60 animate-pulse"></div>
                ))}
              </div>
            ) : resourcesList.length === 0 ? (
              <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 text-center text-xs text-portal-text-secondary">
                <span>No resources cataloged yet.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {resourcesList.slice(0, 3).map((res) => (
                  <div key={res.id} className="p-4 rounded-xl bg-portal-card border border-portal-border/50 hover:border-slate-700 transition-colors flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate" title={res.title}>{res.title}</h4>
                      <p className="text-[10px] text-portal-text-secondary mt-0.5">{res.category} &bull; {res.type.toUpperCase()}</p>
                    </div>
                    <Link
                      href={`/resources/${res.slug}`}
                      className="p-2 bg-slate-900 border border-portal-border hover:border-portal-primary rounded-lg text-portal-text-secondary hover:text-white transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Recent Activity (Simulated Audit log) */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-portal-warning" />
              <span>Recent Activity</span>
            </h2>

            <div className="p-5 rounded-2xl bg-gradient-to-b from-portal-card to-slate-950 border border-portal-border/60 space-y-4 text-xs text-portal-text-secondary">
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-portal-success mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold text-white">Security Sync</p>
                  <p className="mt-0.5">Firebase verification tokens verified successfully.</p>
                  <span className="text-[9px] text-portal-text-secondary font-mono">Just now</span>
                </div>
              </div>

              <div className="border-t border-portal-border/40 my-3"></div>

              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-portal-secondary mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold text-white">Directory Catalog Loaded</p>
                  <p className="mt-0.5">Retrieved {resourcesList.length} files and {coursesList.length} courses from Firestore.</p>
                  <span className="text-[9px] text-portal-text-secondary font-mono">2 mins ago</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
