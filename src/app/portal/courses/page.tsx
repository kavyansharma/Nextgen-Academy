"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments, addDocument, updateDocument } from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";
import {
  BookOpen,
  Lock,
  Unlock,
  Loader2,
  Clock,
  User,
  Plus,
  ArrowRight,
  Sparkles,
  X,
  CreditCard,
  CheckCircle2
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
  createdAt: string;
}

export default function CoursesPage() {
  const { user, refreshUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all"); // 'all' | 'free' | 'premium'
  const [upgradeCourse, setUpgradeCourse] = useState<Course | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Load courses & auto-seed if empty
  const fetchAndSeed = async () => {
    if (!user) return;
    try {
      setLoadingCourses(true);
      const constraints = (user.role === "admin" || user.role === "paid")
        ? []
        : [where("type", "==", "free")];
      const list = await queryDocuments("courses", ...constraints) as Course[];
      
      if (list.length === 0) {
        console.log("No courses found in Firestore. Auto-seeding default courses catalog...");
        
        // Define default courses to seed
        const defaultCourses = [
          {
            title: "Lean Manufacturing Fundamentals",
            category: "Operations",
            type: "free" as const,
            description: "Learn core lean production concepts, value stream mapping, waste identification, and standard work.",
            thumbnail: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60",
            duration: "4 hours",
            instructor: "Sarah Jenkins"
          },
          {
            title: "Introduction to Industry 4.0",
            category: "Technology",
            type: "free" as const,
            description: "Explore industrial internet of things (IIoT), automation, cyber-physical systems, and cloud integration in manufacturing.",
            thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60",
            duration: "3 hours",
            instructor: "Dr. Aris Thorne"
          },
          {
            title: "Basics of Supply Chain Management",
            category: "Logistics",
            type: "free" as const,
            description: "Understand raw materials sourcing, logistics, inventory management, demand forecasting, and distribution systems.",
            thumbnail: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60",
            duration: "5 hours",
            instructor: "David Vance"
          },
          {
            title: "Engineering Career Preparation",
            category: "Career",
            type: "free" as const,
            description: "Build resume, portfolio, learn technical interviewing strategies, and industry networking for engineering professionals.",
            thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60",
            duration: "2.5 hours",
            instructor: "Michael Chang"
          },
          {
            title: "Advanced Lean Six Sigma",
            category: "Quality",
            type: "premium" as const,
            description: "Master DMAIC framework, statistical process control, Hypothesis Testing, and process capability analysis to earn Black Belt readiness.",
            thumbnail: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60",
            duration: "12 hours",
            instructor: "Elena Rostova"
          },
          {
            title: "Digital Factory Transformation",
            category: "Technology",
            type: "premium" as const,
            description: "Complete guide to planning, executing, and scaling digital factory transformation with MES, IoT, and analytics.",
            thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=60",
            duration: "10 hours",
            instructor: "Dr. Aris Thorne"
          },
          {
            title: "Industrial Leadership Masterclass",
            category: "Leadership",
            type: "premium" as const,
            description: "Develop leadership traits, operations management, communication, and change management skills for plant managers.",
            thumbnail: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=60",
            duration: "8 hours",
            instructor: "Sarah Jenkins"
          },
          {
            title: "Smart Manufacturing Certification",
            category: "Operations",
            type: "premium" as const,
            description: "Complete industrial training covering automated controls, robotics, PLC architectures, and SCADA systems.",
            thumbnail: "https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&auto=format&fit=crop&q=60",
            duration: "15 hours",
            instructor: "John Doe"
          }
        ];

        // Seed courses and their lessons
        for (const c of defaultCourses) {
          const courseId = await addDocument("courses", c);
          
          // Seed 3 mockup lessons per course under courses/{courseId}/lessons subcollection
          const defaultLessons = [
            {
              title: "Module 1: Introduction & Foundational Concepts",
              description: "This lesson provides an overview and foundational insights of the course subject material.",
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              pdfUrl: "/resources/lean-six-sigma.pdf",
              order: 1,
              duration: "45 mins"
            },
            {
              title: "Module 2: Structural Methodologies & Key Frameworks",
              description: "This lesson details structural frameworks and methodologies used in modern business cases.",
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              pdfUrl: "/resources/lean-six-sigma.pdf",
              order: 2,
              duration: "1 hour"
            },
            {
              title: "Module 3: Industry Case Studies & Implementation Guides",
              description: "This lesson shares practical industrial case studies and deployment instructions.",
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              pdfUrl: "/resources/lean-six-sigma.pdf",
              order: 3,
              duration: "1.5 hours"
            }
          ];

          for (const l of defaultLessons) {
            await addDocument(`courses/${courseId}/lessons`, l);
          }
        }

        // Re-fetch
        const updatedList = await queryDocuments("courses", ...constraints) as Course[];
        setCourses(updatedList);
      } else {
        setCourses(list);
      }
    } catch (err) {
      console.error("Error loading courses:", err);
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchAndSeed();
  }, [user]);

  if (!user) return null;

  const hasAccess = (courseType: string) => {
    if (user.role === "admin" || user.role === "paid") return true;
    return courseType === "free";
  };

  // Upgrade user's tier to Paid in Firestore
  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await updateDocument("users", user.uid, { role: "paid" });
      await refreshUser();
      setUpgradeSuccess(true);
      setTimeout(() => {
        setUpgradeSuccess(false);
        setUpgradeCourse(null);
        fetchAndSeed();
      }, 2000);
    } catch (err) {
      console.error("Upgrade error:", err);
      alert("Failed to process payment simulation.");
    } finally {
      setIsUpgrading(false);
    }
  };

  // Categories
  const categories = ["All", ...Array.from(new Set(courses.map(c => c.category)))];

  // Filters
  const filteredCourses = courses.filter(c => {
    const matchesCategory = selectedCategory === "All" || c.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesType = selectedTypeFilter === "all" || c.type === selectedTypeFilter;
    return matchesCategory && matchesType;
  });

  if (loadingCourses) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-portal-bg text-portal-text-primary">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 border-4 border-portal-primary border-t-transparent rounded-full animate-spin mx-auto text-portal-primary" />
          <p className="text-portal-text-secondary text-sm tracking-wide">Syncing courses syllabus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="border-b border-portal-border/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Academy Courses</h1>
          <p className="text-sm text-portal-text-secondary mt-1">Acquire verified certificates, specialized training modules, and executive learning path guides.</p>
        </div>

        {user.role === "admin" && (
          <Link
            href="/portal/admin/courses"
            className="self-start sm:self-center px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Courses</span>
          </Link>
        )}
      </div>

      {/* Filter controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Course Type selector tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-portal-border/50 max-w-sm">
          {[
            { id: "all", label: "All Courses" },
            { id: "free", label: "Free Tier" },
            { id: "premium", label: "Premium Tier" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTypeFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedTypeFilter === tab.id
                  ? "bg-portal-primary text-white shadow-sm"
                  : "text-portal-text-secondary hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Categories tags - Desktop */}
        <div className="hidden md:flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? "bg-portal-primary text-white border-portal-primary shadow-md shadow-portal-primary/20"
                  : "bg-portal-card border-portal-border/60 text-portal-text-secondary hover:text-white hover:border-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Category tags - Mobile Selector */}
        <div className="block md:hidden">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-portal-card border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.map((c) => {
          const userHasAccess = hasAccess(c.type);
          return (
            <div
              key={c.id}
              className="bg-portal-card border border-portal-border/50 rounded-3xl overflow-hidden hover:border-portal-primary/40 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between group h-[420px] shadow-lg"
            >
              {/* Thumbnail banner */}
              <div className="h-44 overflow-hidden relative border-b border-portal-border/40">
                <img
                  src={c.thumbnail}
                  alt={c.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/10 transition-colors"></div>
                
                {/* Category badge absolute */}
                <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-950/80 text-portal-secondary border border-portal-border/40 backdrop-blur-sm">
                  {c.category}
                </span>

                {/* Level Access Lock Badge */}
                <span className={`absolute top-4 right-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-sm ${
                  c.type === "free"
                    ? "bg-portal-success/90 border-portal-success/20 text-white"
                    : "bg-portal-warning/90 border-portal-warning/20 text-slate-950"
                }`}>
                  {c.type === "free" ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  <span>{c.type}</span>
                </span>
              </div>

              {/* Course Info details */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-portal-primary transition-colors duration-200 line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-portal-text-secondary leading-relaxed line-clamp-3">
                    {c.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 text-xs text-portal-text-secondary border-t border-portal-border/40 pt-4">
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="w-4 h-4 text-portal-primary" />
                    {c.duration || "Self-paced"}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <User className="w-4 h-4 text-portal-secondary" />
                    {c.instructor || "Expert Faculty"}
                  </span>
                </div>
              </div>

              {/* Action trigger button */}
              <div className="p-6 pt-0">
                {userHasAccess ? (
                  <Link
                    href={`/portal/courses/${c.id}`}
                    className="w-full py-3 px-4 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <span>Start Learning</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    onClick={() => setUpgradeCourse(c)}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-portal-border hover:border-portal-warning text-portal-text-secondary hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-portal-warning" />
                    <span>Unlock Premium Course</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade Gate Modal */}
      {upgradeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => { if (!isUpgrading && !upgradeSuccess) setUpgradeCourse(null); }}></div>

          <div className="relative w-full max-w-md bg-portal-card border border-portal-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in z-10 text-slate-100 overflow-hidden">
            {/* Background highlights */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-portal-warning/10 rounded-full blur-2xl"></div>

            <button
              onClick={() => setUpgradeCourse(null)}
              disabled={isUpgrading || upgradeSuccess}
              className="absolute top-4 right-4 p-2 rounded-xl text-portal-text-secondary hover:text-white hover:bg-slate-800 disabled:opacity-30"
            >
              <X className="w-5 h-5" />
            </button>

            {upgradeSuccess ? (
              <div className="py-8 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-portal-success/10 border border-portal-success/20 flex items-center justify-center text-portal-success mx-auto">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-white">Upgrade Successful!</h3>
                <p className="text-sm text-portal-text-secondary">Welcome to Premium Learning. Unlocking course content...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-portal-warning/10 border border-portal-warning/20 flex items-center justify-center text-portal-warning mx-auto">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Unlock Premium Learning</h3>
                  <p className="text-xs text-portal-text-secondary max-w-xs mx-auto">
                    Upgrade to access advanced industrial courses, certifications, plant operation templates, and elite consulting resources.
                  </p>
                </div>

                <div className="bg-slate-950 p-4.5 rounded-2xl border border-portal-border/60 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-portal-success" />
                    <span>All Premium Courses (15+ hours)</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-portal-success" />
                    <span>Print-Ready Certificates of Completion</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-portal-success" />
                    <span>Private Consulting Library & PDF files</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleUpgrade}
                    disabled={isUpgrading}
                    className="w-full py-3.5 rounded-xl bg-portal-warning hover:bg-portal-warning/90 text-slate-950 font-bold text-sm shadow-lg shadow-portal-warning/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Upgrading Membership...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Upgrade Membership</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setUpgradeCourse(null)}
                    disabled={isUpgrading}
                    className="w-full py-3 rounded-xl border border-portal-border hover:bg-slate-800 text-xs font-bold text-portal-text-secondary hover:text-white transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
