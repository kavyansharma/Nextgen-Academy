"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  queryDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  uploadFile,
  logAdminAction
} from "@/lib/services/firestoreService";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Video,
  FileText,
  X,
  BookOpen,
  Sliders,
  Loader2,
  CheckCircle2,
  AlertCircle
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
  lessonsCount?: number;
  createdAt: string;
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string;
  pdfUrl: string;
  order: number;
}

export default function AdminCoursesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Lists
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Active state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Modals / Form toggles
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null);

  // Form States (Course)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"free" | "premium">("free");
  const [duration, setDuration] = useState("");
  const [instructor, setInstructor] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submittingCourse, setSubmittingCourse] = useState(false);

  // Form States (Lesson)
  const [lessonTitle, setLessonTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [order, setOrder] = useState(1);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [submittingLesson, setSubmittingLesson] = useState(false);

  // Global Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  // Lessons loading and file upload states
  const [lessonsTrigger, setLessonsTrigger] = useState(0);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch all courses
  const loadData = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    try {
      setLoadingData(true);
      const allCourses = await queryDocuments("courses");
      setCourses(allCourses as Course[]);
 
      // Update selected course reference if it is active
      if (selectedCourse) {
        const updated = allCourses.find((c: any) => c.id === selectedCourse.id);
        setSelectedCourse(updated as Course || null);
      }
    } catch (err) {
      console.error("Error loading admin courses data:", err);
      showToast("error", "Failed to retrieve directory data from Firestore.");
    } finally {
      setLoadingData(false);
    }
  }, [user, selectedCourse]);

  // Fetch lessons for the selected course dynamically
  useEffect(() => {
    async function fetchLessons() {
      if (!selectedCourse || !user || user.role !== "admin") {
        setLessons([]);
        return;
      }
      try {
        setLoadingLessons(true);
        const fetched = await queryDocuments(`courses/${selectedCourse.id}/lessons`) as Lesson[];
        fetched.sort((a, b) => (a.order || 0) - (b.order || 0));
        setLessons(fetched);
      } catch (err) {
        console.error("Error loading subcollection lessons:", err);
      } finally {
        setLoadingLessons(false);
      }
    }
    fetchLessons();
  }, [selectedCourse, user, lessonsTrigger]);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      loadData();
    };
    run();
  }, [loadData]);



  // Course CRUD
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !description.trim() || !thumbnail.trim() || !category.trim() || !user) {
      setFormError("All fields are required.");
      return;
    }
    setSubmittingCourse(true);
    try {
      const courseId = await addDocument("courses", {
        title: title.trim(),
        description: description.trim(),
        thumbnail: thumbnail.trim(),
        category: category.trim(),
        type,
        duration: duration.trim() || "Self-paced",
        instructor: instructor.trim() || "Expert Faculty",
        lessonsCount: 0
      });
      await logAdminAction(user.uid, user.email || "", "CREATE_COURSE", `Created course: ${title.trim()} (${type}) with ID ${courseId}`);
      showToast("success", "Course successfully added!");
      setIsAddCourseOpen(false);
      // Reset
      setTitle("");
      setDescription("");
      setThumbnail("");
      setCategory("");
      setType("free");
      setDuration("");
      setInstructor("");
      loadData();
    } catch (err) {
      console.error("Error adding course:", err);
      setFormError("Failed to save course.");
    } finally {
      setSubmittingCourse(false);
    }
  };

  const handleOpenEditCourse = (c: Course) => {
    setCourseToEdit(c);
    setTitle(c.title);
    setDescription(c.description);
    setThumbnail(c.thumbnail);
    setCategory(c.category);
    setType(c.type);
    setDuration(c.duration || "");
    setInstructor(c.instructor || "");
    setFormError(null);
  };

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!courseToEdit || !user) return;

    if (!title.trim() || !description.trim() || !thumbnail.trim() || !category.trim()) {
      setFormError("All fields are required.");
      return;
    }
    setSubmittingCourse(true);
    try {
      await updateDocument("courses", courseToEdit.id, {
        title: title.trim(),
        description: description.trim(),
        thumbnail: thumbnail.trim(),
        category: category.trim(),
        type,
        duration: duration.trim() || "Self-paced",
        instructor: instructor.trim() || "Expert Faculty"
      });
      await logAdminAction(user.uid, user.email || "", "UPDATE_COURSE", `Updated course metadata for: ${title.trim()} (${courseToEdit.id})`);
      showToast("success", "Course updated successfully!");
      setCourseToEdit(null);
      loadData();
    } catch (err) {
      console.error("Error updating course:", err);
      setFormError("Failed to update course.");
    } finally {
      setSubmittingCourse(false);
    }
  };

  const handleDeleteCourse = async (cId: string) => {
    if (!confirm("Are you sure you want to delete this course? All associated lessons will also be deleted.") || !user) return;
    try {
      // Delete associated lessons from subcollection courses/{cId}/lessons
      const courseLessons = await queryDocuments(`courses/${cId}/lessons`) as Lesson[];
      for (const l of courseLessons) {
        await deleteDocument(`courses/${cId}/lessons`, l.id);
      }

      await deleteDocument("courses", cId);
      await logAdminAction(user.uid, user.email || "", "DELETE_COURSE", `Deleted course: ${cId} and its ${courseLessons.length} subcollection lessons`);

      showToast("success", "Course and lessons deleted.");
      if (selectedCourse?.id === cId) {
        setSelectedCourse(null);
      }
      loadData();
    } catch (err) {
      console.error("Error deleting course:", err);
      showToast("error", "Failed to delete course.");
    }
  };

  // Lesson CRUD
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLessonError(null);
    if (!selectedCourse || !user) return;

    if (!lessonTitle.trim() || !videoUrl.trim()) {
      setLessonError("Module Title and Video URL are required.");
      return;
    }
    setSubmittingLesson(true);
    try {
      const lessonId = await addDocument(`courses/${selectedCourse.id}/lessons`, {
        courseId: selectedCourse.id,
        title: lessonTitle.trim(),
        videoUrl: videoUrl.trim(),
        pdfUrl: pdfUrl.trim(),
        order: Number(order) || 1
      });
      
      // Update course's lessons count metadata
      const newLessonsCount = (selectedCourse.lessonsCount || 0) + 1;
      await updateDocument("courses", selectedCourse.id, {
        lessonsCount: newLessonsCount
      });

      await logAdminAction(user.uid, user.email || "", "CREATE_LESSON", `Created lesson: ${lessonTitle.trim()} (order: ${order}) under course ID ${selectedCourse.id} (Lesson Doc ID ${lessonId})`);
      showToast("success", "Lesson added successfully!");
      setIsAddLessonOpen(false);
      // Reset
      setLessonTitle("");
      setVideoUrl("");
      setPdfUrl("");
      setOrder(lessons.length + 2);
      
      // Trigger lessons list reload and courses list reload
      setLessonsTrigger(prev => prev + 1);
      loadData();
    } catch (err) {
      console.error("Error adding lesson:", err);
      setLessonError("Failed to add lesson.");
    } finally {
      setSubmittingLesson(false);
    }
  };

  const handleOpenEditLesson = (l: Lesson) => {
    setLessonToEdit(l);
    setLessonTitle(l.title);
    setVideoUrl(l.videoUrl);
    setPdfUrl(l.pdfUrl);
    setOrder(l.order);
    setLessonError(null);
  };

  const handleEditLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLessonError(null);
    if (!lessonToEdit || !selectedCourse || !user) return;

    if (!lessonTitle.trim() || !videoUrl.trim()) {
      setLessonError("Module Title and Video URL are required.");
      return;
    }
    setSubmittingLesson(true);
    try {
      await updateDocument(`courses/${selectedCourse.id}/lessons`, lessonToEdit.id, {
        title: lessonTitle.trim(),
        videoUrl: videoUrl.trim(),
        pdfUrl: pdfUrl.trim(),
        order: Number(order) || 1
      });
      await logAdminAction(user.uid, user.email || "", "UPDATE_LESSON", `Updated lesson ID ${lessonToEdit.id} metadata under course ${selectedCourse.id}`);
      showToast("success", "Lesson updated!");
      setLessonToEdit(null);
      setLessonsTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error updating lesson:", err);
      setLessonError("Failed to update lesson.");
    } finally {
      setSubmittingLesson(false);
    }
  };

  const handleDeleteLesson = async (lId: string) => {
    if (!confirm("Delete this lesson?") || !selectedCourse || !user) return;
    try {
      await deleteDocument(`courses/${selectedCourse.id}/lessons`, lId);

      // Update course's lessons count metadata
      const newLessonsCount = Math.max(0, (selectedCourse.lessonsCount || 0) - 1);
      await updateDocument("courses", selectedCourse.id, {
        lessonsCount: newLessonsCount
      });

      await logAdminAction(user.uid, user.email || "", "DELETE_LESSON", `Deleted lesson ID ${lId} from course ${selectedCourse.id}`);
      showToast("success", "Lesson deleted.");
      setLessonsTrigger(prev => prev + 1);
      loadData();
    } catch (err) {
      console.error("Error deleting lesson:", err);
      showToast("error", "Failed to delete lesson.");
    }
  };

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-portal-bg text-portal-text-primary">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 border-4 border-portal-primary border-t-transparent rounded-full animate-spin mx-auto text-portal-primary" />
          <p className="text-portal-text-secondary text-sm tracking-wide">Validating administrator access...</p>
        </div>
      </div>
    );
  }

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
      <div className="border-b border-portal-border/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl flex items-center gap-2">
            <Sliders className="w-8 h-8 text-portal-primary animate-pulse" />
            <span>Course Management</span>
          </h1>
          <p className="text-sm text-portal-text-secondary mt-1">Publish new courses, upload module lessons, set PDF materials, and manage access levels.</p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsAddCourseOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Create Course</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex gap-3 p-4 rounded-xl text-sm border shadow-lg animate-fade-in ${
          toast.type === "success" 
            ? "bg-portal-success/10 border-portal-success/20 text-portal-success" 
            : "bg-red-500/10 border-red-500/20 text-red-200"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Admin Panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Courses list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary">Syllabus Directory</h3>

          {loadingData ? (
            <div className="p-12 text-center text-portal-text-secondary">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-portal-primary mb-3" />
              <span>Fetching directories...</span>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-16 rounded-3xl bg-portal-card border border-portal-border/60 text-center">
              <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="font-bold text-white">No courses created yet</p>
              <p className="text-xs text-portal-text-secondary mt-1">Create your first academy course to populate the portal catalog.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {courses.map((c) => (
                <div
                  key={c.id}
                  className={`bg-portal-card border rounded-2xl p-5 flex flex-col justify-between h-56 transition-all duration-205 cursor-pointer ${
                    selectedCourse?.id === c.id
                      ? "border-portal-primary bg-slate-900/60"
                      : "border-portal-border/60 hover:border-slate-600"
                  }`}
                  onClick={() => setSelectedCourse(c)}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-950 text-portal-secondary border border-portal-border/40">
                        {c.category}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        c.type === "free" ? "bg-portal-success/10 text-portal-success border-portal-success/20" : "bg-portal-warning/10 text-portal-warning border-portal-warning/20"
                      }`}>
                        {c.type}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-md line-clamp-1">{c.title}</h4>
                    <p className="text-xs text-portal-text-secondary line-clamp-3 leading-relaxed">{c.description}</p>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between border-t border-portal-border/40 pt-4 mt-2">
                    <span className="text-[10px] text-portal-text-secondary font-semibold">
                      {c.lessonsCount || 0} Lessons
                    </span>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEditCourse(c)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-portal-border text-portal-secondary hover:text-white hover:bg-portal-secondary/15 transition-all"
                        title="Edit Course"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(c.id)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-portal-border text-red-400 hover:text-white hover:bg-red-500/15 transition-all"
                        title="Delete Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Lessons manager for selected course */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary">Syllabus Modules</h3>
            {selectedCourse && (
              <button
                onClick={() => {
                  setLessonTitle("");
                  setVideoUrl("");
                  setPdfUrl("");
                  setOrder(lessons.length + 1);
                  setLessonError(null);
                  setIsAddLessonOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-portal-border hover:border-portal-primary text-xs font-bold text-portal-primary hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Lesson</span>
              </button>
            )}
          </div>

          {selectedCourse ? (
            <div className="bg-portal-card border border-portal-border/60 rounded-2xl overflow-hidden shadow-md">
              <div className="p-4 bg-slate-950 border-b border-portal-border/60">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider line-clamp-1">{selectedCourse.title}</h4>
                <p className="text-[10px] text-portal-text-secondary mt-0.5">Lessons Catalog Editor</p>
              </div>

              <div className="divide-y divide-portal-border/30 max-h-[480px] overflow-y-auto">
                {lessons.length === 0 ? (
                  <div className="p-12 text-center text-portal-text-secondary text-xs">
                    <span>No lessons published. Click &apos;Add Lesson&apos; to begin.</span>
                  </div>
                ) : (
                  lessons
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((lesson) => (
                      <div key={lesson.id} className="p-4 flex items-center justify-between gap-4 bg-slate-900/10 hover:bg-slate-900/30">
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-portal-secondary uppercase">Order {lesson.order}</span>
                          <h5 className="text-xs font-bold text-slate-200 truncate mt-0.5" title={lesson.title}>{lesson.title}</h5>
                          <div className="flex gap-2 items-center text-[10px] text-portal-text-secondary mt-1">
                            <span className="flex items-center gap-0.5"><Video className="w-3 h-3" /> Video</span>
                            {lesson.pdfUrl && <span className="flex items-center gap-0.5"><FileText className="w-3 h-3" /> PDF</span>}
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenEditLesson(lesson)}
                            className="p-1 rounded-lg border border-portal-border/50 text-portal-secondary hover:text-white"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="p-1 rounded-lg border border-portal-border/50 text-red-400 hover:text-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-portal-card border border-portal-border/60 text-center text-xs text-portal-text-secondary">
              <span>Select a course from the directory to manage its syllabus lessons.</span>
            </div>
          )}
        </div>
      </div>

      {/* Course Modal (Create & Edit) */}
      {(isAddCourseOpen || courseToEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => { if (!submittingCourse) { setIsAddCourseOpen(false); setCourseToEdit(null); } }}></div>

          <form
            onSubmit={courseToEdit ? handleEditCourse : handleAddCourse}
            className="relative w-full max-w-lg bg-portal-card border border-portal-border rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-portal-border/60 pb-3">
              <h3 className="text-lg font-bold text-white">{courseToEdit ? "Modify Course Profile" : "Create Academy Course"}</h3>
              <button
                type="button"
                onClick={() => { setIsAddCourseOpen(false); setCourseToEdit(null); }}
                className="p-1.5 rounded-lg text-portal-text-secondary hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Course Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Smart Factory Implementation"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Description Overview</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Summarize course content and goals..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Operations"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Access Level</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm cursor-pointer"
                  >
                    <option value="free">Free Tier</option>
                    <option value="premium">Premium Tier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Estimated Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 5 hours"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Instructor Name</label>
                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Thumbnail Image</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="Image URL or upload a file..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm"
                  />
                  <label className="px-4 py-2.5 rounded-xl bg-slate-900 border border-portal-border hover:border-portal-primary text-xs font-bold text-portal-primary flex items-center justify-center cursor-pointer transition-all hover:bg-slate-850">
                    {uploadingThumbnail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload File"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setUploadingThumbnail(true);
                          const downloadUrl = await uploadFile(file, `thumbnails/${Date.now()}_${file.name}`);
                          setThumbnail(downloadUrl);
                          showToast("success", "Thumbnail uploaded successfully!");
                        } catch (err: any) {
                          console.error("Error uploading thumbnail:", err);
                          showToast("error", "Failed to upload thumbnail.");
                        } finally {
                          setUploadingThumbnail(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-portal-border/60">
              <button
                type="button"
                onClick={() => { setIsAddCourseOpen(false); setCourseToEdit(null); }}
                className="flex-1 py-3 rounded-xl border border-portal-border hover:bg-slate-900 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingCourse}
                className="flex-1 py-3 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                {submittingCourse && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{courseToEdit ? "Save Changes" : "Publish Course"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lesson Modal (Create & Edit) */}
      {(isAddLessonOpen || lessonToEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => { if (!submittingLesson) { setIsAddLessonOpen(false); setLessonToEdit(null); } }}></div>

          <form
            onSubmit={lessonToEdit ? handleEditLesson : handleAddLesson}
            className="relative w-full max-w-lg bg-portal-card border border-portal-border rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-portal-border/60 pb-3">
              <h3 className="text-lg font-bold text-white">{lessonToEdit ? "Modify Syllabus Module" : "Add Lesson Module"}</h3>
              <button
                type="button"
                onClick={() => { setIsAddLessonOpen(false); setLessonToEdit(null); }}
                className="p-1.5 rounded-lg text-portal-text-secondary hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {lessonError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{lessonError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Module Title</label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g. Module 1: Foundational Industrial Standards"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Video Iframe Embed / Link</label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Module Order</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    min={1}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Downloadable PDF Materials (Optional)</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="PDF URL or upload a file..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm"
                  />
                  <label className="px-4 py-2.5 rounded-xl bg-slate-900 border border-portal-border hover:border-portal-primary text-xs font-bold text-portal-primary flex items-center justify-center cursor-pointer transition-all hover:bg-slate-850">
                    {uploadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload PDF"}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setUploadingPdf(true);
                          const downloadUrl = await uploadFile(file, `lessons/pdfs/${Date.now()}_${file.name}`);
                          setPdfUrl(downloadUrl);
                          showToast("success", "Lesson PDF uploaded successfully!");
                        } catch (err: any) {
                          console.error("Error uploading PDF:", err);
                          showToast("error", "Failed to upload PDF.");
                        } finally {
                          setUploadingPdf(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-portal-border/60">
              <button
                type="button"
                onClick={() => { setIsAddLessonOpen(false); setLessonToEdit(null); }}
                className="flex-1 py-3 rounded-xl border border-portal-border hover:bg-slate-900 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingLesson}
                className="flex-1 py-3 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                {submittingLesson && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{lessonToEdit ? "Save changes" : "Add Lesson"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
