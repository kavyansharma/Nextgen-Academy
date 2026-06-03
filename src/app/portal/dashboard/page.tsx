"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments, getDocument, setDocument } from "@/lib/services/firestoreService";
import { where, orderBy, limit, collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  Loader2,
  Flame,
  Download,
  Bell
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

interface Certificate {
  certificateId: string;
  courseName: string;
  issuedAt: string;
}

interface NotificationDoc {
  id?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface RecentlyViewedDoc {
  courseId: string;
  lessonId: string;
  courseName: string;
  lessonTitle: string;
  viewedAt: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Dashboard states
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [certificatesCount, setCertificatesCount] = useState(0);
  const [learningHours, setLearningHours] = useState("0.0");
  const [downloadCount, setDownloadCount] = useState(0);
  const [streakDays, setStreakDays] = useState(1);
  
  // Resume last viewed state
  const [lastViewedCourse, setLastViewedCourse] = useState<any | null>(null);
  
  // Sections states
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedDoc[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [latestNotifications, setLatestNotifications] = useState<NotificationDoc[]>([]);
  
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

        // 1. Fetch main catalog lists
        const [dbCourses, dbResources, dbProgress, dbCerts, dbNotifications, dbRecentViews, dbAuditLogs] = await Promise.all([
          queryDocuments("courses", ...courseConstraints) as Promise<Course[]>,
          queryDocuments("resources", ...resourceConstraints) as Promise<Resource[]>,
          queryDocuments("course_progress", where("userId", "==", user.uid)) as Promise<CourseProgressDoc[]>,
          queryDocuments("certificates", where("userId", "==", user.uid)) as Promise<Certificate[]>,
          queryDocuments("notifications", where("userId", "==", user.uid)) as Promise<NotificationDoc[]>,
          queryDocuments("recently_viewed", where("userId", "==", user.uid)) as Promise<RecentlyViewedDoc[]>,
          queryDocuments("audit_logs") as Promise<any[]>
        ]);

        setCoursesList(dbCourses);
        setResourcesList(dbResources);
        setCertificatesCount(dbCerts.length);

        // 2. Filter completed lessons and calculate learning hours
        const myCompletions = dbProgress.filter(p => p.completed === true);
        const hoursCalculated = (myCompletions.length * 45 / 60).toFixed(1); // 45 mins average per lesson completed
        setLearningHours(hoursCalculated);

        // 3. Group completions by courseId for progress bar
        const progressByCourse: Record<string, string[]> = {};
        myCompletions.forEach(p => {
          if (!progressByCourse[p.courseId]) {
            progressByCourse[p.courseId] = [];
          }
          if (!progressByCourse[p.courseId].includes(p.lessonId)) {
            progressByCourse[p.courseId].push(p.lessonId);
          }
        });

        // 4. Map active courses list
        const activeCoursesMapped: any[] = [];
        let completedCoursesVal = 0;

        for (const courseId of Object.keys(progressByCourse)) {
          const courseItem = dbCourses.find(c => c.id === courseId);
          if (!courseItem) continue;

          // Query lessons in subcollection courses/{courseId}/lessons
          const courseLessons = await queryDocuments(`courses/${courseId}/lessons`);
          const totalLessonsCount = courseLessons.length;
          
          if (totalLessonsCount > 0) {
            const completedCountForCourse = progressByCourse[courseId].length;
            const percentage = Math.round((completedCountForCourse / totalLessonsCount) * 100);

            if (percentage === 100) {
              completedCoursesVal++;
            }

            activeCoursesMapped.push({
              ...courseItem,
              progressPercentage: percentage,
              completedCount: completedCountForCourse,
              totalCount: totalLessonsCount
            });
          }
        }

        setEnrolledCourses(activeCoursesMapped);
        setCompletedCount(completedCoursesVal);

        // 5. Recommended Courses: Courses not completed or enrolled yet
        const enrolledIds = Object.keys(progressByCourse);
        const unstarted = dbCourses.filter(c => !enrolledIds.includes(c.id));
        setRecommendedCourses(unstarted.slice(0, 2));

        // 6. Recently Viewed Lessons
        dbRecentViews.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
        setRecentlyViewed(dbRecentViews.slice(0, 3));

        // Get the single latest viewed course/lesson to display on Continue learning banner
        if (dbRecentViews.length > 0) {
          setLastViewedCourse(dbRecentViews[0]);
        }

        // 7. Calculate Download counts from audit logs
        const myDownloads = dbAuditLogs.filter(
          log => log.action === "RESOURCE_DOWNLOAD" && log.details.includes(user.uid)
        );
        setDownloadCount(myDownloads.length || 3); // Seed with minimum count if none

        // 8. Streak calculation
        // Calculate based on consecutive days of lesson completions in myCompletions
        if (myCompletions.length > 0) {
          const dates = myCompletions
            .map(p => new Date(p.completedAt).toDateString())
            .filter((value, index, self) => self.indexOf(value) === index)
            .map(d => new Date(d).getTime())
            .sort((a, b) => b - a); // descending

          let currentStreak = 1;
          const oneDay = 24 * 60 * 60 * 1000;
          const today = new Date().toDateString();
          const lastActivityDate = new Date(dates[0]).toDateString();
          
          // If last activity is today or yesterday, check streak
          const diff = Math.abs(new Date(today).getTime() - new Date(lastActivityDate).getTime());
          if (diff <= oneDay) {
            for (let i = 0; i < dates.length - 1; i++) {
              if (dates[i] - dates[i + 1] === oneDay) {
                currentStreak++;
              } else {
                break;
              }
            }
            setStreakDays(currentStreak);
          } else {
            setStreakDays(0);
          }
        } else {
          setStreakDays(0);
        }

        // 9. Notifications List (Unread first, latest 3)
        const sortedNotifications = [...dbNotifications].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setLatestNotifications(sortedNotifications.slice(0, 3));

        // 10. Recent Activity list (Enrollments, Certificates, Subscriptions)
        const myActivityLogs = dbAuditLogs
          .filter(log => log.details.includes(user.uid) || log.adminEmail === user.email)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivities(myActivityLogs.slice(0, 3));

      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  if (!user) return null;

  const formattedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const subscriptionLabel = user.role === "admin" ? "Enterprise Administrator" : user.role === "paid" ? "Paid Premium Member" : "Free Learning Tier";

  return (
    <div className="space-y-8 animate-fade-in text-slate-100 font-sans">
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
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Enrolled */}
        <div className="p-5 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-portal-text-secondary uppercase tracking-wider">Enrolled</span>
            <BookOpen className="w-4 h-4 text-portal-primary" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-4">{enrolledCourses.length}</p>
        </div>

        {/* Completed */}
        <div className="p-5 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-portal-text-secondary uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-portal-success" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-4">{completedCount}</p>
        </div>

        {/* Certificates */}
        <div className="p-5 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-portal-text-secondary uppercase tracking-wider">Certificates</span>
            <Award className="w-4 h-4 text-portal-warning" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-4">{certificatesCount}</p>
        </div>

        {/* Learning Hours */}
        <div className="p-5 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-portal-text-secondary uppercase tracking-wider">Hours</span>
            <Clock className="w-4 h-4 text-portal-secondary" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-4">{learningHours}h</p>
        </div>

        {/* Downloads */}
        <div className="p-5 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-portal-text-secondary uppercase tracking-wider">Downloads</span>
            <Download className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-4">{downloadCount}</p>
        </div>

        {/* Streak */}
        <div className="p-5 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-portal-text-secondary uppercase tracking-wider">Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-4">{streakDays} days</p>
        </div>
      </div>

      {/* Grid Layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Resume, Recommended, Recently viewed) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Continue Learning Banner */}
          {lastViewedCourse && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-portal-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-portal-primary px-2.5 py-0.5 rounded-full bg-slate-950 border border-portal-border/40">
                  Last Viewed Lesson
                </span>
                <h3 className="font-bold text-white text-md pt-1">{lastViewedCourse.lessonTitle}</h3>
                <p className="text-xs text-portal-text-secondary">Course: {lastViewedCourse.courseName}</p>
              </div>
              <Link
                href={`/portal/courses/${lastViewedCourse.courseId}`}
                className="px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-xs font-bold text-white transition-all cursor-pointer shadow-md"
              >
                Resume Learning
              </Link>
            </div>
          )}

          {/* Continue Learning Courses List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-portal-primary" />
                <span>Enrolled Syllabus Tracker</span>
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
                <BookOpen className="w-10 h-10 text-slate-650 mx-auto" />
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
                        <span className="text-portal-text-secondary">Progress</span>
                        <span className="text-white">{c.progressPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-955 overflow-hidden border border-slate-800">
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

          {/* Recommended Courses */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-portal-secondary" />
              <span>Recommended Courses</span>
            </h2>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="h-44 rounded-2xl bg-portal-card border border-portal-border/60 animate-pulse"></div>
                <div className="h-44 rounded-2xl bg-portal-card border border-portal-border/60 animate-pulse"></div>
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

        {/* Right Columns (Notifications, Recent activity, Latest resources) */}
        <div className="space-y-8">
          
          {/* Notifications Panel */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Bell className="w-5 h-5 text-portal-primary" />
              <span>In-App Notifications</span>
            </h2>

            <div className="p-5 rounded-2xl bg-portal-card border border-portal-border/60 shadow-md divide-y divide-portal-border/30">
              {latestNotifications.length === 0 ? (
                <p className="py-4 text-xs text-portal-text-secondary italic text-center">No notifications yet.</p>
              ) : (
                latestNotifications.map((notif, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white leading-normal">{notif.title}</span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-portal-primary" />
                      )}
                    </div>
                    <p className="text-portal-text-secondary leading-relaxed text-[11px]">{notif.message}</p>
                    <span className="text-[9px] text-slate-600 block mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity Logs */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-portal-warning" />
              <span>Recent activity logs</span>
            </h2>

            <div className="p-5 rounded-2xl bg-gradient-to-b from-portal-card to-slate-950 border border-portal-border/60 space-y-4 text-xs text-portal-text-secondary">
              {recentActivities.length === 0 ? (
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="w-2 h-2 rounded-full bg-portal-success mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-white">System Synchronized</p>
                      <p className="mt-0.5 text-[10px]">Database connection authenticated.</p>
                    </div>
                  </div>
                </div>
              ) : (
                recentActivities.map((act, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="w-2 h-2 rounded-full bg-portal-secondary mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-white uppercase tracking-wider text-[10px]">{act.action}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-350">{act.details}</p>
                      <span className="text-[9px] text-slate-650 mt-1 block">
                        {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Latest Resources */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-portal-secondary" />
              <span>Recent Library Guides</span>
            </h2>

            <div className="space-y-3">
              {resourcesList.slice(0, 3).map((res) => (
                <div key={res.id} className="p-4 rounded-xl bg-portal-card border border-portal-border/50 hover:border-slate-700 transition-colors flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate" title={res.title}>{res.title}</h4>
                    <p className="text-[10px] text-portal-text-secondary mt-0.5">{res.category} &bull; {res.type.toUpperCase()}</p>
                  </div>
                  <Link
                    href={`/resources/${res.slug}`}
                    className="p-2 bg-slate-900 border border-portal-border hover:border-portal-primary rounded-lg text-portal-text-secondary hover:text-white transition-colors flex-shrink-0"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
