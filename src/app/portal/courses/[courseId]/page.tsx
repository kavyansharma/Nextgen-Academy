"use client";

import React, { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  queryDocuments,
  getDocument,
  setDocument,
  deleteDocument
} from "@/lib/services/firestoreService";
import { doc, updateDoc, collection, addDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { trackCourseView, trackLessonView } from "@/lib/services/activityService";
import { trackEvent } from "@/lib/analytics";
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
  ChevronRight,
  Star,
  Bookmark,
  Notebook,
  MessageSquare,
  Sparkles,
  CreditCard
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
  price?: number;
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

interface Review {
  id?: string;
  userId: string;
  userName: string;
  courseId: string;
  rating: number;
  review: string;
  createdAt: string;
}

export default function CourseDetailsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.courseId;

  const { user, firebaseUser, refreshUser } = useAuth();
  const router = useRouter();

  // Data states
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // Video resolution states
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>("");
  const [loadingVideo, setLoadingVideo] = useState(false);

  // Tab State: 'overview' | 'notes' | 'reviews'
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "reviews">("overview");

  // Notes state
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [togglingBookmark, setTogglingBookmark] = useState(false);

  // Reviews state
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState(5);
  const [userReviewText, setUserReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Payment states
  const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false);

  // Load Razorpay Script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);



  const loadReviews = useCallback(async () => {
    try {
      const list = await queryDocuments("course_reviews", where("courseId", "==", courseId)) as Review[];
      
      // Fetch names for reviewers dynamically
      const reviewsWithNames = await Promise.all(list.map(async (rev) => {
        const uDoc = await getDocument("users", rev.userId);
        return {
          ...rev,
          userName: uDoc?.fullName || "NextGen Student"
        };
      }));

      reviewsWithNames.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviewsList(reviewsWithNames);
    } catch (err) {
      console.error("Error loading reviews:", err);
    }
  }, [courseId]);

  // Fetch Course, Lessons, Progress, and Bookmarks
  const loadData = useCallback(async () => {
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
      trackCourseView(user.uid, courseId, courseData.title);

      // Verify Access
      const hasAccess = user.role === "admin" || user.role === "paid" || courseData.type === "free";
      if (!hasAccess) {
        router.replace("/portal/courses");
        return;
      }

      // Check and track enrollment (and push notification if new)
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

        // Push enrollment notification
        await addDoc(collection(db, "notifications"), {
          userId: user.uid,
          title: "New Course Enrolled",
          message: `You have successfully enrolled in "${courseData.title}". Let's start learning!`,
          type: "enrollment",
          read: false,
          createdAt: new Date().toISOString()
        });

        // Audit log enrollment
        await addDoc(collection(db, "audit_logs"), {
          adminId: "SYSTEM",
          adminEmail: user.email,
          action: "COURSE_ENROLLED",
          details: `User enrolled in course: ${courseData.title} (ID: ${courseId})`,
          timestamp: new Date().toISOString()
        });

        // GA event tracking
        trackEvent({
          action: "course_enrollment",
          category: "courses",
          label: courseData.title
        });
      }

      // Fetch Lessons
      const courseLessons = await queryDocuments(`courses/${courseId}/lessons`) as Lesson[];
      courseLessons.sort((a, b) => (a.order || 0) - (b.order || 0));
      setLessons(courseLessons);

      if (courseLessons.length > 0) {
        setActiveLesson(courseLessons[0]);
      }

      // Fetch completions
      const allProgress = await queryDocuments(
        "course_progress",
        where("userId", "==", user.uid)
      ) as CourseProgressDoc[];
      const myProgress = allProgress.filter(
        p => p.courseId === courseId && p.completed === true
      );
      setCompletedLessonIds(myProgress.map(p => p.lessonId));

      // Fetch reviews
      await loadReviews();

    } catch (err) {
      console.error("Error loading course details:", err);
    } finally {
      setLoadingData(false);
    }
  }, [user, courseId, router, loadReviews]);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      if (user && courseId) {
        loadData();
      }
    };
    run();
  }, [user, courseId, loadData]);

  // Track active lesson change for Notes, Bookmarks & GCS resolution
  useEffect(() => {
    if (!activeLesson || !user || !firebaseUser) return;

    const loadLessonDetails = async () => {
      // 1. Resolve Secure GCS video if private path
      setLoadingVideo(true);
      if (activeLesson.videoUrl.startsWith("videos/")) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const res = await fetch(`/api/videos/signed-url?path=${encodeURIComponent(activeLesson.videoUrl)}`, {
            headers: {
              Authorization: `Bearer ${idToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setResolvedVideoUrl(data.url);
          } else {
            console.error("Failed to retrieve signed URL.");
            setResolvedVideoUrl("");
          }
        } catch (err) {
          console.error("Error fetching video signature:", err);
          setResolvedVideoUrl("");
        }
      } else {
        setResolvedVideoUrl(activeLesson.videoUrl);
      }
      setLoadingVideo(false);

      // 2. Fetch bookmarks state
      const bkId = `${user.uid}_${activeLesson.id}`;
      const bkDoc = await getDocument("bookmarks", bkId);
      setIsBookmarked(!!bkDoc);

      // 3. Fetch notes state
      const noteId = `${user.uid}_${activeLesson.id}`;
      const noteDoc = await getDocument("notes", noteId);
      setNoteText(noteDoc?.content || "");
      setNoteSaved(false);

      // 4. Update Recently Viewed Lessons in Firestore
      await setDocument("recently_viewed", `${user.uid}_${courseId}`, {
        userId: user.uid,
        courseId,
        lessonId: activeLesson.id,
        courseName: course?.title || "",
        lessonTitle: activeLesson.title,
        viewedAt: new Date().toISOString()
      });

      // Update global last viewed lesson
      await updateDoc(doc(db, "users", user.uid), {
        lastCourseId: courseId,
        lastLessonId: activeLesson.id,
        lastViewedAt: new Date().toISOString()
      });

      trackLessonView(user.uid, courseId, activeLesson.id, activeLesson.title);
    };

    loadLessonDetails();
  }, [activeLesson, user, firebaseUser]);

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

  // Toggle lesson complete
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

      let updatedCompletions = [];
      if (isCurrentlyCompleted) {
        updatedCompletions = completedLessonIds.filter(id => id !== lessonId);
      } else {
        updatedCompletions = [...completedLessonIds, lessonId];
        
        // Push notification for lesson complete
        await addDoc(collection(db, "notifications"), {
          userId: user.uid,
          title: "Module Completed",
          message: `Great job! You completed the module: "${lessons.find(l => l.id === lessonId)?.title || "Lesson"}"`,
          type: "lesson",
          read: false,
          createdAt: new Date().toISOString()
        });
      }
      setCompletedLessonIds(updatedCompletions);

      const progressPercent = lessons.length > 0 ? Math.round((updatedCompletions.length / lessons.length) * 100) : 0;
      await setDocument("enrollments", `${user.uid}_${courseId}`, {
        userId: user.uid,
        courseId,
        progress: progressPercent,
        completed: progressPercent === 100
      });

      // If finished course, generate certificate
      if (progressPercent === 100) {
        const certId = `NG-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const verCode = `V-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        
        await setDocument("certificates", certId, {
          certificateId: certId,
          userId: user.uid,
          courseId,
          courseName: course.title,
          issuedAt: new Date().toISOString(),
          verificationCode: verCode
        });

        // In-app Notification
        await addDoc(collection(db, "notifications"), {
          userId: user.uid,
          title: "Certificate Earned!",
          message: `Congratulations! You've successfully finished "${course.title}" and earned your credential.`,
          type: "certificate",
          read: false,
          createdAt: new Date().toISOString()
        });

        // Log audit
        await addDoc(collection(db, "audit_logs"), {
          adminId: "SYSTEM",
          adminEmail: user.email,
          action: "CERTIFICATE_EARNED",
          details: `User earned certificate ${certId} for course completion.`,
          timestamp: new Date().toISOString()
        });

        // GA event tracking
        trackEvent({
          action: "certificate_generation",
          category: "certificates",
          label: course.title
        });
      }
    } catch (err) {
      console.error("Error toggling lesson progress:", err);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = async () => {
    if (!user || !activeLesson || togglingBookmark) return;
    setTogglingBookmark(true);
    const bkId = `${user.uid}_${activeLesson.id}`;
    
    try {
      if (isBookmarked) {
        await deleteDocument("bookmarks", bkId);
        setIsBookmarked(false);
      } else {
        await setDocument("bookmarks", bkId, {
          userId: user.uid,
          lessonId: activeLesson.id,
          createdAt: new Date().toISOString()
        });
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    } finally {
      setTogglingBookmark(false);
    }
  };

  // Save Notes
  const handleSaveNotes = async () => {
    if (!user || !activeLesson || savingNote) return;
    setSavingNote(true);
    setNoteSaved(false);
    const noteId = `${user.uid}_${activeLesson.id}`;

    try {
      await setDocument("notes", noteId, {
        userId: user.uid,
        lessonId: activeLesson.id,
        content: noteText,
        updatedAt: new Date().toISOString()
      });
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);
    } catch (err) {
      console.error("Error saving notes:", err);
    } finally {
      setSavingNote(false);
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submittingReview || !userReviewText.trim()) return;
    setSubmittingReview(true);

    try {
      const reviewId = `REV-${Date.now()}-${user.uid.substring(0, 5)}`;
      await setDocument("course_reviews", reviewId, {
        userId: user.uid,
        courseId,
        rating: userRating,
        review: userReviewText.trim(),
        createdAt: new Date().toISOString()
      });

      setUserReviewText("");
      await loadReviews();
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Razorpay Checkout Gateway Integration
  const handleRazorpayUpgrade = async () => {
    if (!firebaseUser) return;
    setIsCheckoutProcessing(true);
    try {
      // 1. Fetch Auth Token
      const idToken = await firebaseUser.getIdToken();

      // 2. Call Order Creation API
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          amount: course.price || 49, // Price in Rupees/USD
          currency: "INR"
        })
      });

      if (!res.ok) {
        throw new Error("Failed to initialize payment gateway order.");
      }

      const orderData = await res.json();

      // 3. Configure Razorpay standard options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "NextGen Academy",
        description: `Unlock Course: ${course.title}`,
        order_id: orderData.id,
        handler: async (response: any) => {
          setIsCheckoutProcessing(true);
          try {
            // 4. Verify Payment Server-Side
            const verifyRes = await fetch("/api/payments/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                amount: course.price || 49,
                currency: "INR"
              })
            });

            if (verifyRes.ok) {
              trackEvent({
                action: "payment_completion",
                category: "payments",
                label: course.title,
                value: course.price || 49
              });
              await refreshUser();
              router.refresh();
              alert("Congratulations! Membership upgraded and course unlocked.");
              window.location.reload();
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            console.error("Verification Call Failed:", err);
          } finally {
            setIsCheckoutProcessing(false);
          }
        },
        prefill: {
          name: user.fullName,
          email: user.email,
        },
        theme: {
          color: "#f97316"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay trigger error:", err);
      alert(err.message || "Failed to initiate payment. Please try again.");
    } finally {
      setIsCheckoutProcessing(false);
    }
  };

  // Navigations
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

  // Calculation of Ratings
  const totalReviews = reviewsList.length;
  const avgRating = totalReviews > 0 
    ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : "5.0";

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans">
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
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span className="flex items-center gap-1 font-semibold">
                <Star className="w-3.5 h-3.5 text-portal-warning fill-portal-warning" />
                <span>{avgRating}/5 Rating ({totalReviews} Reviews)</span>
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
              <h3 className="font-bold text-white text-md">Congratulations! You&apos;ve Completed the Course!</h3>
              <p className="text-xs text-portal-text-secondary mt-0.5">Your credentials are now active. Premium users can download the PDF certificate.</p>
            </div>
          </div>
          <Link
            href="/portal/certificates"
            className="px-5 py-2.5 rounded-xl bg-portal-success hover:bg-portal-success/90 text-slate-950 font-bold text-xs shadow-md transition-all whitespace-nowrap animate-pulse"
          >
            Claim Certificate
          </Link>
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Video Player & Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {activeLesson ? (
            <div className="space-y-4">
              {/* Video Player */}
              <div className="rounded-3xl border border-portal-border/60 bg-slate-950 overflow-hidden shadow-xl aspect-video relative">
                {loadingVideo ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
                    <Loader2 className="w-10 h-10 animate-spin text-portal-primary" />
                  </div>
                ) : resolvedVideoUrl.startsWith("http") && !resolvedVideoUrl.includes("youtube.com") && !resolvedVideoUrl.includes("embed") ? (
                  <video
                    src={resolvedVideoUrl}
                    controls
                    controlsList="nodownload"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <iframe
                    src={resolvedVideoUrl}
                    title={activeLesson.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                )}
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

                    {/* Bookmark Lesson */}
                    <button
                      onClick={handleToggleBookmark}
                      disabled={togglingBookmark}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isBookmarked
                          ? "bg-portal-secondary/15 border-portal-secondary/35 text-portal-secondary"
                          : "bg-slate-900 border-portal-border text-portal-text-secondary hover:text-white"
                      }`}
                      title={isBookmarked ? "Remove Bookmark" : "Bookmark Lesson"}
                    >
                      <Bookmark className={`w-4.5 h-4.5 ${isBookmarked ? "fill-portal-secondary" : ""}`} />
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

              {/* Student tools tabs */}
              <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 shadow-sm space-y-4">
                <div className="flex border-b border-portal-border/30">
                  {[
                    { id: "overview", label: "Overview", icon: Notebook },
                    { id: "notes", label: "Lesson Notes", icon: FileText },
                    { id: "reviews", label: "Reviews & Feedback", icon: MessageSquare }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                          activeTab === tab.id
                            ? "border-portal-primary text-portal-primary"
                            : "border-transparent text-portal-text-secondary hover:text-white"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab content 1: Overview */}
                {activeTab === "overview" && (
                  <div className="text-xs text-portal-text-secondary leading-relaxed space-y-2 pt-2 animate-fade-in">
                    <p className="font-semibold text-white">Course Overview</p>
                    <p>{course.description}</p>
                    <div className="flex items-center gap-2 mt-4 text-[10px] uppercase font-bold text-amber-500">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>Certified Curriculum powered by NextGen Advisory Registry.</span>
                    </div>
                  </div>
                )}

                {/* Tab content 2: Notes */}
                {activeTab === "notes" && (
                  <div className="space-y-4 pt-2 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-portal-text-secondary tracking-wide">Write study notes for this lesson:</span>
                      {noteSaved && (
                        <span className="text-[10px] font-bold text-portal-success flex items-center gap-1 animate-pulse">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Notes auto-saved!</span>
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={5}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Type your summary, formulas, or observations here..."
                      className="w-full p-4 rounded-xl bg-slate-950 border border-portal-border text-white text-xs placeholder-slate-650 focus:outline-none focus:border-portal-primary"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNote}
                        className="px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                      >
                        {savingNote ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Save Note</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab content 3: Reviews */}
                {activeTab === "reviews" && (
                  <div className="space-y-6 pt-2 animate-fade-in">
                    
                    {/* Add Review Form */}
                    <form onSubmit={handleSubmitReview} className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-portal-border/40">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Leave a Review</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-portal-text-secondary">Rating:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setUserRating(star)}
                              className="text-portal-warning cursor-pointer"
                            >
                              <Star className={`w-4 h-4 ${star <= userRating ? "fill-portal-warning" : ""}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        required
                        value={userReviewText}
                        onChange={(e) => setUserReviewText(e.target.value)}
                        placeholder="Write your feedback regarding instructor clarity, slides detail, or takeaways..."
                        className="w-full p-3 rounded-xl bg-slate-950 border border-portal-border text-white text-xs placeholder-slate-600 focus:outline-none focus:border-portal-primary"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="px-4 py-2 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                        >
                          {submittingReview ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span>Submit Review</span>
                          )}
                        </button>
                      </div>
                    </form>

                    {/* Review List */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-portal-text-secondary">Student Reviews ({totalReviews})</h4>
                      <div className="divide-y divide-portal-border/30 max-h-56 overflow-y-auto pr-1">
                        {reviewsList.length === 0 ? (
                          <p className="py-4 text-xs text-portal-text-secondary italic">No student reviews published for this course yet.</p>
                        ) : (
                          reviewsList.map((rev) => (
                            <div key={rev.id || rev.createdAt} className="py-3.5 space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-white">@{rev.userName}</span>
                                <div className="flex gap-0.5 text-portal-warning">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`w-3.5 h-3.5 ${star <= rev.rating ? "fill-portal-warning" : ""}`} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-portal-text-secondary leading-relaxed">{rev.review}</p>
                              <span className="text-[9px] text-slate-600 font-mono">{new Date(rev.createdAt).toLocaleDateString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
