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
  type?: "free" | "paid";
  accessLevel?: "free" | "paid";
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

interface EnrolledCourse extends Course {
  progressPercentage: number;
  completedCount: number;
  totalCount: number;
}

interface LastViewedCourse {
  courseId: string;
  courseName: string;
  lessonId: string;
  lessonTitle: string;
}

interface ActivityItem {
  type: string;
  details: string;
  timestamp: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Dashboard states
  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [certificatesCount, setCertificatesCount] = useState(0);
  const [learningHours, setLearningHours] = useState("0.0");
  const [downloadCount, setDownloadCount] = useState(0);
  const [streakDays, setStreakDays] = useState(1);
  
  // Resume last viewed state
  const [lastViewedCourse, setLastViewedCourse] = useState<LastViewedCourse | null>(null);
  const [continueCourseProgress, setContinueCourseProgress] = useState<number>(0);
  
  // Sections states
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [recentlyViewedCourses, setRecentlyViewedCourses] = useState<Course[]>([]);
  const [recentlyViewedResources, setRecentlyViewedResources] = useState<Resource[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [latestNotifications, setLatestNotifications] = useState<NotificationDoc[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      try {
        setLoading(true);

        const userRole = user.role;
        const courseConstraints = (userRole === "admin" || userRole === "paid")
          ? []
          : [where("type", "==", "free")];

        const resourceConstraints = (userRole === "admin" || userRole === "paid")
          ? []
          : [where("accessLevel", "==", "free")];

        // Fetch user activity from activityService
        const { getUserActivity } = await import("@/lib/services/activityService");

        // Helper to query firestore safely, catching errors individually
        const safeQuery = async <T,>(queryFn: () => Promise<T>, fallback: T, name: string): Promise<T> => {
          try {
            return await queryFn();
          } catch (e) {
            console.warn(`Dashboard load warning: failed to fetch ${name}. Using fallback.`, e);
            return fallback;
          }
        };

        // 1. Fetch main catalog lists and activity data
        const [dbCourses, dbResources, dbProgress, dbCerts, dbNotifications, activityData] = await Promise.all([
          safeQuery(() => queryDocuments("courses", ...courseConstraints) as Promise<Course[]>, [], "courses"),
          safeQuery(() => queryDocuments("resources", ...resourceConstraints) as Promise<Resource[]>, [], "resources"),
          safeQuery(() => queryDocuments("course_progress", where("userId", "==", user.uid)) as Promise<CourseProgressDoc[]>, [], "course_progress"),
          safeQuery(() => queryDocuments("certificates", where("userId", "==", user.uid)) as Promise<Certificate[]>, [], "certificates"),
          safeQuery(() => queryDocuments("notifications", where("userId", "==", user.uid)) as Promise<NotificationDoc[]>, [], "notifications"),
          safeQuery(() => getUserActivity(user.uid), null, "user activity")
        ]);
        setResourcesList(dbResources);
        setCertificatesCount(dbCerts.length);

        // 2. Filter completed lessons and calculate learning hours
        const myCompletions = dbProgress.filter(p => p.completed === true);
        const hoursCalculated = (myCompletions.length * 45 / 60).toFixed(1); // 45 mins average per lesson completed
        setLearningHours(hoursCalculated);

        // 3. Group completions by courseId for progress bar
        const progressByCourse: Record<string, string[]> = {};
        myCompletions.forEach(p => {
          if (!p.courseId) return;
          if (!progressByCourse[p.courseId]) {
            progressByCourse[p.courseId] = [];
          }
          if (p.lessonId && !progressByCourse[p.courseId].includes(p.lessonId)) {
            progressByCourse[p.courseId].push(p.lessonId);
          }
        });

        // 4. Map active courses list
        const activeCoursesMapped: EnrolledCourse[] = [];
        let completedCoursesVal = 0;

        for (const courseId of Object.keys(progressByCourse)) {
          const courseItem = dbCourses.find(c => c.id === courseId);
          if (!courseItem) continue;

          // Query lessons in subcollection courses/{courseId}/lessons safely
          let courseLessons: any[] = [];
          try {
            courseLessons = await queryDocuments(`courses/${courseId}/lessons`);
          } catch (e) {
            console.warn(`Dashboard load warning: failed to fetch lessons for course ${courseId}`, e);
          }
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

        // 6. Recently Viewed Courses from user_activity
        if (activityData && activityData.recentlyViewedCourses) {
          const recCourses = activityData.recentlyViewedCourses
            .map(id => dbCourses.find(c => c.id === id))
            .filter(Boolean) as Course[];
          setRecentlyViewedCourses(recCourses);
        }

        // 7. Recently Viewed Resources from user_activity
        if (activityData && activityData.recentlyViewedResources) {
          const recResources = activityData.recentlyViewedResources
            .map(slug => dbResources.find(r => r.slug === slug || r.id === slug))
            .filter(Boolean) as Resource[];
          setRecentlyViewedResources(recResources);
        }

        // Get the single latest viewed course/lesson to display on Continue learning banner
        if (activityData && activityData.lastCourseViewed) {
          const courseItem = dbCourses.find(c => c.id === activityData.lastCourseViewed);
          if (courseItem) {
            let lessonTitle = "Introduction";
            let progressPercent = 0;
            
            let lessonsList: any[] = [];
            try {
              lessonsList = await queryDocuments(`courses/${activityData.lastCourseViewed}/lessons`);
            } catch (e) {
              console.warn(`Dashboard load warning: failed to fetch lessons for last viewed course ${activityData.lastCourseViewed}`, e);
            }
            if (lessonsList.length > 0) {
              const matchedLesson = lessonsList.find(l => l.id === activityData.lastLessonViewed);
              if (matchedLesson) {
                lessonTitle = matchedLesson.title;
              } else {
                lessonTitle = lessonsList[0].title;
              }
              
              const completedCountForCourse = progressByCourse[activityData.lastCourseViewed]?.length || 0;
              progressPercent = Math.round((completedCountForCourse / lessonsList.length) * 100);
            }
            
            setLastViewedCourse({
              courseId: activityData.lastCourseViewed,
              courseName: courseItem.title,
              lessonId: activityData.lastLessonViewed || "",
              lessonTitle: lessonTitle
            });
            setContinueCourseProgress(progressPercent);
          }
        }

        // 8. Download counts from user_activity counters
        setDownloadCount(activityData ? activityData.totalResourcesDownloaded : 0);

        // 9. Streak calculation
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

        // 10. Notifications List (Unread first, latest 3)
        const sortedNotifications = [...dbNotifications].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setLatestNotifications(sortedNotifications.slice(0, 3));

        // 11. Recent Activity list (from activityData.activityTimeline)
        if (activityData && activityData.activityTimeline) {
          setRecentActivities(activityData.activityTimeline.slice(0, 5));
        } else {
          setRecentActivities([]);
        }

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
  const subscriptionLabel = 
    user.role === "admin" 
      ? "Enterprise Administrator" 
      : user.role === "paid" 
        ? "Paid Premium Member" 
        : "Free Learning Tier";

  return (
    <div className="space-y-8 animate-fade-in text-slate-800 font-sans">
      {/* Top Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 border border-blue-700 shadow-md overflow-hidden group text-white">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-white/15 transition-all duration-700"></div>
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-white text-2xl font-bold shadow-lg border border-white/20">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Welcome, {user.fullName}</h1>
                <Sparkles className="w-5.5 h-5.5 text-amber-300 animate-pulse" />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1.5 text-xs text-blue-100">
                <span className="font-semibold text-white">@{user.username}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/30"></span>
                <span>System Role: <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-[10px]">{formattedRole}</span></span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/30"></span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Last login: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-full border border-white/30 bg-white/10 text-white text-xs font-bold shadow-sm uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              <span>{subscriptionLabel}</span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Enrolled */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-100 flex flex-col justify-between group hover:border-slate-300 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Enrolled</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-4">{enrolledCourses.length}</p>
        </div>

        {/* Completed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-100 flex flex-col justify-between group hover:border-slate-300 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-4">{completedCount}</p>
        </div>

        {/* Certificates */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-100 flex flex-col justify-between group hover:border-slate-300 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Certificates</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-4">{certificatesCount}</p>
        </div>

        {/* Learning Hours */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-100 flex flex-col justify-between group hover:border-slate-300 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hours</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-4">{learningHours}h</p>
        </div>

        {/* Downloads */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-100 flex flex-col justify-between group hover:border-slate-300 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Downloads</span>
            <Download className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-4">{downloadCount}</p>
        </div>

        {/* Streak */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-100 flex flex-col justify-between group hover:border-slate-300 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Streak</span>
            <Flame className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-4">{streakDays} days</p>
        </div>
      </div>

      {/* Grid Layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Resume, Recommended, Recently viewed) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Continue Learning Card */}
          {lastViewedCourse ? (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-60 h-60 bg-blue-50/30 rounded-full blur-[60px] pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                      Continue Learning
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{lastViewedCourse.courseName}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Current Lesson: <span className="font-semibold text-slate-850">{lastViewedCourse.lessonTitle}</span>
                    </p>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-1 max-w-md">
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-slate-500">Syllabus Progress</span>
                      <span className="text-slate-900 font-bold">{continueCourseProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full border border-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-blue-650 rounded-full transition-all duration-500"
                        style={{ width: `${continueCourseProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/portal/courses/${lastViewedCourse.courseId}`}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-750 hover:scale-[1.02] text-xs font-bold text-white transition-all cursor-pointer shadow-md flex items-center gap-2 justify-center whitespace-nowrap self-stretch md:self-auto"
                >
                  <span>Resume Lesson</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">Start your learning journey</p>
              <p className="text-xs text-slate-500">Select an enrolled course below to resume or start watching lessons.</p>
            </div>
          )}

          {/* Continue Learning Courses List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Enrolled Syllabus Tracker</span>
              </h2>
              <Link href="/portal/courses" className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1">
                <span>See All Courses</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                <p className="text-xs text-slate-500">Syncing learning timeline...</p>
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <div>
                  <p className="font-bold text-slate-900">No active course enrollments</p>
                  <p className="text-xs text-slate-500 mt-1">Explore our professional training catalog to start learning.</p>
                </div>
                <Link
                  href="/portal/courses"
                  className="inline-flex px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all shadow-md"
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledCourses.map((c) => (
                  <div key={c.id} className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-350 hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-blue-600 px-2.5 py-0.5 rounded-full bg-blue-50/50 border border-blue-100">
                        {c.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-md pt-1">{c.title}</h3>
                      <p className="text-xs text-slate-550 font-medium">Progress: {c.completedCount} of {c.totalCount} modules completed</p>
                    </div>

                    <div className="w-full sm:w-48 space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">Progress</span>
                        <span className="text-slate-900 font-bold">{c.progressPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${c.progressPercentage}%` }}></div>
                      </div>
                    </div>

                    <Link
                      href={`/portal/courses/${c.id}`}
                      className="px-4.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-350 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer self-stretch sm:self-auto text-center shadow-sm"
                    >
                      Resume
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Viewed Courses */}
          {recentlyViewedCourses.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>Recently Viewed Courses</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentlyViewedCourses.slice(0, 2).map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-36 shadow-sm group">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50/50 text-blue-600 border border-blue-100">
                        {c.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{c.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{c.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <Link
                        href={`/portal/courses/${c.id}`}
                        className="text-xs font-bold text-blue-650 hover:underline flex items-center gap-1"
                      >
                        <span>Resume Course</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Viewed Resources */}
          {recentlyViewedResources.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-blue-600" />
                <span>Recently Viewed Resources</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentlyViewedResources.slice(0, 2).map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-36 shadow-sm group">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50/50 text-blue-600 border border-blue-100">
                        {r.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{r.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{r.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <Link
                        href={`/resources/${r.slug}`}
                        className="text-xs font-bold text-blue-650 hover:underline flex items-center gap-1"
                      >
                        <span>View Resource</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Courses */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-blue-600" />
              <span>Recommended Courses</span>
            </h2>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="h-44 rounded-2xl bg-white border border-slate-200 animate-pulse"></div>
                <div className="h-44 rounded-2xl bg-white border border-slate-200 animate-pulse"></div>
              </div>
            ) : recommendedCourses.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-sm">
                <span>You are currently enrolled in all of our active courses!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {recommendedCourses.map((c) => (
                  <div key={c.id} className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-350 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-44 shadow-sm group">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50/50 text-blue-600 border border-blue-100">
                          {c.category}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          c.type === "free" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}>
                          {c.type}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{c.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{c.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <Link
                        href="/portal/courses"
                        className="text-xs font-bold text-blue-650 hover:underline flex items-center gap-1"
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
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-650" />
              <span>In-App Notifications</span>
            </h2>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm divide-y divide-slate-100">
              {latestNotifications.length === 0 ? (
                <p className="py-4 text-xs text-slate-500 italic text-center">No notifications yet.</p>
              ) : (
                latestNotifications.map((notif, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 leading-normal">{notif.title}</span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-650" />
                      )}
                    </div>
                    <p className="text-slate-500 leading-relaxed text-[11px]">{notif.message}</p>
                    <span className="text-[9px] text-slate-400 block mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-600" />
              <span>Recent Activity Timeline</span>
            </h2>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 shadow-sm">
              {recentActivities.length === 0 ? (
                <p className="py-4 text-xs text-slate-500 italic text-center">No recent activities logged.</p>
              ) : (
                <div className="space-y-6 relative before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-slate-100 ml-1">
                  {recentActivities.map((act, idx) => {
                    let dotColor = "bg-blue-600";
                    if (act.type === "login") dotColor = "bg-sky-500";
                    else if (act.type === "course_view") dotColor = "bg-blue-650";
                    else if (act.type === "lesson_view") dotColor = "bg-indigo-550";
                    else if (act.type === "resource_download") dotColor = "bg-purple-500";

                    return (
                      <div key={idx} className="flex gap-4 items-start relative pl-8">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-[11px] leading-snug">{act.details}</p>
                          <span className="text-[9px] text-slate-400 block">
                            {new Date(act.timestamp).toLocaleDateString()} &bull; {new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Latest Resources */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              <span>Recent Library Guides</span>
            </h2>

            <div className="space-y-3">
              {resourcesList.slice(0, 3).map((res) => (
                <div key={res.id} className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-350 shadow-sm transition-colors flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate" title={res.title}>{res.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{res.category} &bull; {(res.type || res.accessLevel || "free").toUpperCase()}</p>
                  </div>
                  <Link
                    href={`/resources/${res.slug}`}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-350 rounded-lg text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0 shadow-sm"
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
