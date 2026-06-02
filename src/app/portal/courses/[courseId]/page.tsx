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
import {
  ArrowLeft,
  Clock,
  User,
  CheckCircle2,
  Play,
  FileText,
  Loader2,
  Award,
  Video
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
  courseId: string;
  title: string;
  videoUrl: string;
  pdfUrl: string;
  order: number;
}

interface CourseProgress {
  userId: string;
  courseId: string;
  completedLessons: string[]; // List of lesson IDs completed
  progressPercentage: number;
}

export default function CourseDetailsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.courseId;

  const { user } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch Course details, Lessons, and Progress
  useEffect(() => {
    async function loadData() {
      if (!user || !courseId) return;
      try {
        setLoadingData(true);

        // Fetch Course
        const courseData = await getDocument("courses", courseId) as Course;
        if (!courseData) {
          router.replace("/portal/courses");
          return;
        }
        setCourse(courseData);

        // Fetch Lessons for this course
        const allLessons = await queryDocuments("lessons") as Lesson[];
        const courseLessons = allLessons
          .filter(l => l.courseId === courseId)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setLessons(courseLessons);

        if (courseLessons.length > 0) {
          setActiveLesson(courseLessons[0]);
        }

        // Fetch User Progress
        const allProgress = await queryDocuments("course_progress") as CourseProgress[];
        const userProgress = allProgress.find(p => p.userId === user.uid && p.courseId === courseId);
        
        if (userProgress) {
          setProgress(userProgress);
        } else {
          // Init empty progress
          const initProgress = {
            userId: user.uid,
            courseId,
            completedLessons: [],
            progressPercentage: 0
          };
          setProgress(initProgress);
        }
      } catch (err) {
        console.error("Error loading course details:", err);
      } finally {
        setLoadingData(false);
      }
    }

    if (user && courseId) {
      loadData();
    }
  }, [user, courseId]);

  if (!user) return null;

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

  if (!course) return null;

  const isLessonCompleted = (lessonId: string) => {
    if (!progress) return false;
    return progress.completedLessons.includes(lessonId);
  };

  // Toggle lesson complete state
  const handleToggleComplete = async (lessonId: string) => {
    if (!progress || lessons.length === 0) return;

    let updatedCompleted = [...progress.completedLessons];
    if (updatedCompleted.includes(lessonId)) {
      updatedCompleted = updatedCompleted.filter(id => id !== lessonId);
    } else {
      updatedCompleted.push(lessonId);
    }

    const percentage = Math.round((updatedCompleted.length / lessons.length) * 100);

    const newProgress = {
      ...progress,
      completedLessons: updatedCompleted,
      progressPercentage: percentage
    };

    // Save to Firestore using a composite ID or searching
    // Since setDocument needs collection + docId, let's use `${user.uid}_${courseId}` as the unique doc ID!
    // This is a very clean and standard way to merge progress records.
    try {
      await setDocument("course_progress", `${user.uid}_${courseId}`, newProgress);
      setProgress(newProgress);
    } catch (err) {
      console.error("Error saving progress to Firestore:", err);
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

      {/* Banner / Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-portal-card border border-portal-border/60 shadow-xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-portal-primary/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10">
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900/60 text-portal-secondary border border-portal-border/50">
              {course.category}
            </span>
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

          {/* Progress Bar overall */}
          <div className="w-full md:w-64 space-y-2 bg-slate-900/40 p-4 rounded-2xl border border-portal-border/40">
            <div className="flex justify-between items-center text-xs">
              <span className="text-portal-text-secondary font-bold">Course Completed</span>
              <span className="text-white font-extrabold">{progress?.progressPercentage || 0}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full border border-portal-border/30 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-portal-primary to-portal-secondary rounded-full transition-all duration-500"
                style={{ width: `${progress?.progressPercentage || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Completion congratulations banner */}
      {progress?.progressPercentage === 100 && (
        <div className="p-5 rounded-2xl bg-portal-success/10 border border-portal-success/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="p-2 bg-portal-success/20 rounded-xl text-portal-success flex-shrink-0">
              <Award className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-white text-md">Congratulations! You've Completed the Course!</h3>
              <p className="text-xs text-portal-text-secondary mt-0.5">Your official print-ready certificate is now generated and active.</p>
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

      {/* Video Player & Modules layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Player & Active Lesson */}
        <div className="lg:col-span-2 space-y-6">
          {activeLesson ? (
            <div className="space-y-4">
              {/* Responsive Video frame wrapper */}
              <div className="rounded-3xl border border-portal-border/60 bg-slate-950 overflow-hidden shadow-xl aspect-video relative">
                <iframe
                  src={activeLesson.videoUrl}
                  title={activeLesson.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Lesson details & Action button bar */}
              <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{activeLesson.title}</h3>
                    <p className="text-xs text-portal-text-secondary mt-0.5">Module {activeLesson.order} of {lessons.length}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Mark complete trigger */}
                    <button
                      onClick={() => handleToggleComplete(activeLesson.id)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer border transition-all ${
                        isLessonCompleted(activeLesson.id)
                          ? "bg-slate-900 border-portal-success/40 text-portal-success"
                          : "bg-portal-primary hover:bg-portal-primary/90 border-portal-primary text-white shadow-md shadow-portal-primary/10"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isLessonCompleted(activeLesson.id) ? "Completed" : "Mark as Complete"}</span>
                    </button>

                    {/* PDF materials download */}
                    {activeLesson.pdfUrl && (
                      <a
                        href={activeLesson.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-slate-900 border border-portal-border hover:border-portal-secondary text-portal-text-secondary hover:text-white transition-all"
                        title="Download Learning Materials"
                      >
                        <FileText className="w-4.5 h-4.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 rounded-3xl bg-portal-card border border-portal-border/60 text-center space-y-4">
              <Play className="w-12 h-12 text-slate-650 mx-auto" />
              <div>
                <p className="font-bold text-white">No Lessons Seeded</p>
                <p className="text-xs text-portal-text-secondary mt-1">This course currently does not have any modules published.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Syllabus & Modules List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary">Course Syllabus</h3>

          <div className="bg-portal-card border border-portal-border/60 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-950 border-b border-portal-border/60 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Lessons Progress</span>
              <span className="text-xs font-semibold text-portal-text-secondary">
                {progress?.completedLessons.length || 0} / {lessons.length} Modules
              </span>
            </div>

            <div className="divide-y divide-portal-border/40 max-h-[480px] overflow-y-auto">
              {lessons.map((lesson) => {
                const isActive = activeLesson?.id === lesson.id;
                const isCompleted = isLessonCompleted(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full text-left p-4 flex items-start gap-3.5 transition-colors cursor-pointer ${
                      isActive ? "bg-slate-900/60" : "hover:bg-slate-900/20"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-portal-success" />
                      ) : isActive ? (
                        <Video className="w-4.5 h-4.5 text-portal-primary animate-pulse" />
                      ) : (
                        <Play className="w-4.5 h-4.5 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isActive ? "text-portal-primary" : "text-portal-text-secondary"}`}>
                        Module {lesson.order}
                      </p>
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
