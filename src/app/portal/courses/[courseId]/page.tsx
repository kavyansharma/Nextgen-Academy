"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  queryDocuments,
  getDocument,
  setDocument
} from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";
import {
  ArrowLeft,
  Clock,
  User,
  CheckCircle2,
  Play,
  FileText,
  Loader2,
  Award,
  Video,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  type: "free" | "premium";
  duration?: string;
  instructor?: string;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  pdfUrl: string;
  order: number;
  duration?: string;
}

interface CourseProgressDoc {
  userId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  completedAt: string;
}

export default function CourseDetailsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.courseId;

  const { user } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // Load Course, Lessons subcollection, and individual Completed Progress documents
  const loadData = async () => {
    if (!user || !courseId) return;
    try {
      setLoadingData(true);

      // Fetch Course Details
      const courseData = await getDocument("courses", courseId) as Course;
      if (!courseData) {
        router.replace("/portal/courses");
        return;
      }
      setCourse(courseData);

      // Verify route access controls (Free user gets redirect or upgrade overlay if premium)
      const hasAccess = user.role === "admin" || user.role === "paid" || courseData.type === "free";
      if (!hasAccess) {
        // Redirect to main courses page where upgrade prompt is handled
        router.replace("/portal/courses");
        return;
      }

      // Check and track enrollment
      const enrollmentId = `${user.uid}_${courseId}`;
      const enrollmentDoc = await getDocument("enrollments", enrollmentId);
      if (!enrollmentDoc) {
        await setDocument("enrollments", enrollmentId, {
          userId: user.uid,
          courseId,
          enrolledAt: new Date().toISOString(),
          completed: false,
          progress: 0
        });
      }

      // Fetch Lessons from courses/{courseId}/lessons subcollection
      const courseLessons = await queryDocuments(`courses/${courseId}/lessons`) as Lesson[];
      courseLessons.sort((a, b) => (a.order || 0) - (b.order || 0));
      setLessons(courseLessons);

      if (courseLessons.length > 0) {
        setActiveLesson(courseLessons[0]);
      }

      // Fetch completions for this user and this course
      const allProgress = await queryDocuments(
        "course_progress",
        where("userId", "==", user.uid)
      ) as CourseProgressDoc[];
      const myProgress = allProgress.filter(
        p => p.courseId === courseId && p.completed === true
      );
      setCompletedLessonIds(myProgress.map(p => p.lessonId));

    } catch (err) {
      console.error("Error loading course syllabus player:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && courseId) {
      loadData();
    }
  }, [user, courseId]);

  if (!user || !course) return null;

  if (loadingData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-portal-bg text-portal-text-primary">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 border-4 border-portal-primary border-t-transparent rounded-full animate-spin mx-auto text-portal-primary" />
          <p className="text-portal-text-secondary text-sm tracking-wide">Assembling learning modules...</p>
        </div>
      </div>
    );
  }

  const isCompleted = (lessonId: string) => completedLessonIds.includes(lessonId);
  const progressPercentage = lessons.length > 0 ? Math.round((completedLessonIds.length / lessons.length) * 100) : 0;

  // Toggle completion document in Firestore
  const handleToggleComplete = async (lessonId: string) => {
    if (isUpdatingProgress) return;
    setIsUpdatingProgress(true);

    const isCurrentlyCompleted = completedLessonIds.includes(lessonId);
    const docId = `${user.uid}_${courseId}_${lessonId}`;

    try {
      await setDocument("course_progress", docId, {
        userId: user.uid,
        courseId,
        lessonId,
        completed: !isCurrentlyCompleted,
        completedAt: new Date().toISOString()
      });

      // Update state in memory and compute new progress percent
      let updatedCompletions = [];
      if (isCurrentlyCompleted) {
        updatedCompletions = completedLessonIds.filter(id => id !== lessonId);
      } else {
        updatedCompletions = [...completedLessonIds, lessonId];
      }
      setCompletedLessonIds(updatedCompletions);

      const progressPercent = lessons.length > 0 ? Math.round((updatedCompletions.length / lessons.length) * 100) : 0;
      await setDocument("enrollments", `${user.uid}_${courseId}`, {
        userId: user.uid,
        courseId,
        progress: progressPercent,
        completed: progressPercent === 100
      });
    } catch (err) {
      console.error("Error toggling lesson progress:", err);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Next/Previous Navigation
  const activeIndex = lessons.findIndex(l => l.id === activeLesson?.id);
  const hasNext = activeIndex >= 0 && activeIndex < lessons.length - 1;
  const hasPrev = activeIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setActiveLesson(lessons[activeIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      setActiveLesson(lessons[activeIndex - 1]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Back button */}
      <div>
        <Link
          href="/portal/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-portal-text-secondary hover:text-portal-primary transition-colors duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Course Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-portal-card border border-portal-border/60 shadow-xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-portal-primary/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900/60 text-portal-secondary border border-portal-border/50">
                {course.category}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-portal-primary/10 border border-portal-primary/20 text-portal-primary">
                {course.type} Course
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{course.title}</h1>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-portal-text-secondary">
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5 text-portal-primary" />
                {course.duration || "Self-paced"}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span className="flex items-center gap-1 font-semibold">
                <User className="w-3.5 h-3.5 text-portal-secondary" />
                Instructor: {course.instructor || "Expert Faculty"}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full md:w-64 space-y-2 bg-slate-900/40 p-4 rounded-2xl border border-portal-border/40">
            <div className="flex justify-between items-center text-xs">
              <span className="text-portal-text-secondary font-bold">Course Completed</span>
              <span className="text-white font-extrabold">{progressPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-955 rounded-full border border-portal-border/30 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-portal-primary to-portal-secondary rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Banner */}
      {progressPercentage === 100 && (
        <div className="p-5 rounded-2xl bg-portal-success/10 border border-portal-success/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="p-2 bg-portal-success/20 rounded-xl text-portal-success flex-shrink-0">
              <Award className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-white text-md">Congratulations! You've Completed the Course!</h3>
              <p className="text-xs text-portal-text-secondary mt-0.5">Your credentials are now active. Premium users can download the PDF certificate.</p>
            </div>
          </div>
          <Link
            href="/portal/certificates"
            className="px-5 py-2.5 rounded-xl bg-portal-success hover:bg-portal-success/90 text-slate-950 font-bold text-xs shadow-md transition-all whitespace-nowrap"
          >
            Claim Certificate
          </Link>
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Video Player */}
        <div className="lg:col-span-2 space-y-6">
          {activeLesson ? (
            <div className="space-y-4">
              {/* Video Player */}
              <div className="rounded-3xl border border-portal-border/60 bg-slate-950 overflow-hidden shadow-xl aspect-video relative">
                <iframe
                  src={activeLesson.videoUrl}
                  title={activeLesson.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Lesson controls */}
              <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-portal-border/40 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-snug">{activeLesson.title}</h3>
                    <p className="text-xs text-portal-text-secondary mt-1">{activeLesson.duration || "Self-paced"} module</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mark Complete */}
                    <button
                      onClick={() => handleToggleComplete(activeLesson.id)}
                      disabled={isUpdatingProgress}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer border transition-all ${
                        isCompleted(activeLesson.id)
                          ? "bg-slate-900 border-portal-success/40 text-portal-success"
                          : "bg-portal-primary hover:bg-portal-primary/90 border-portal-primary text-white shadow-md shadow-portal-primary/10"
                      } disabled:opacity-50`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isCompleted(activeLesson.id) ? "Completed" : "Mark Complete"}</span>
                    </button>

                    {/* PDF Materials */}
                    {activeLesson.pdfUrl && (
                      <a
                        href={activeLesson.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-slate-900 border border-portal-border hover:border-portal-secondary text-portal-text-secondary hover:text-white transition-all"
                        title="Download Lesson PDF"
                      >
                        <FileText className="w-4.5 h-4.5" />
                      </a>
                    )}
                  </div>
                </div>

                {activeLesson.description && (
                  <div className="text-xs text-portal-text-secondary leading-relaxed bg-slate-950/20 p-4 rounded-xl border border-portal-border/30">
                    <p className="font-semibold text-white mb-1">Module Overview</p>
                    {activeLesson.description}
                  </div>
                )}

                {/* Next/Prev Action Buttons */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={handlePrev}
                    disabled={!hasPrev}
                    className="px-4 py-2.5 rounded-xl border border-portal-border hover:bg-slate-900 text-xs font-bold text-portal-text-secondary hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Lesson</span>
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={!hasNext}
                    className="px-4 py-2.5 rounded-xl border border-portal-border hover:bg-slate-900 text-xs font-bold text-portal-text-secondary hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next Lesson</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 rounded-3xl bg-portal-card border border-portal-border/60 text-center space-y-4">
              <Play className="w-12 h-12 text-slate-700 mx-auto" />
              <div>
                <p className="font-bold text-white">No Lessons Seeded</p>
                <p className="text-xs text-portal-text-secondary mt-1">This course syllabus is currently empty.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Lesson sidebar list */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary">Course Syllabus</h3>

          <div className="bg-portal-card border border-portal-border/60 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-950 border-b border-portal-border/60 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Lessons Progress</span>
              <span className="text-xs font-semibold text-portal-text-secondary">
                {completedLessonIds.length} / {lessons.length} Modules
              </span>
            </div>

            <div className="divide-y divide-portal-border/30 max-h-[480px] overflow-y-auto">
              {lessons.map((lesson) => {
                const isActive = activeLesson?.id === lesson.id;
                const isCompletedLesson = isCompleted(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full text-left p-4.5 flex items-start gap-3.5 transition-colors cursor-pointer ${
                      isActive ? "bg-slate-900/60 border-l-2 border-portal-primary" : "hover:bg-slate-900/20"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isCompletedLesson ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-portal-success" />
                      ) : isActive ? (
                        <Video className="w-4.5 h-4.5 text-portal-primary animate-pulse" />
                      ) : (
                        <Play className="w-4.5 h-4.5 text-slate-650" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold uppercase ${isActive ? "text-portal-primary" : "text-portal-text-secondary"}`}>
                          Module {lesson.order}
                        </span>
                        {lesson.duration && <span className="text-[9px] text-portal-text-secondary">{lesson.duration}</span>}
                      </div>
                      <h4 className={`text-xs font-bold truncate mt-0.5 ${isActive ? "text-white" : "text-slate-300"}`}>
                        {lesson.title}
                      </h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
