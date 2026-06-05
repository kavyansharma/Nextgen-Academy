"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  CheckCircle2,
  Mail
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
  const { user, firebaseUser, refreshUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all"); // 'all' | 'free' | 'premium'
  const [upgradeCourse, setUpgradeCourse] = useState<Course | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("premium_yearly");

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

  // Load courses & auto-seed if empty
  const fetchAndSeed = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      fetchAndSeed();
    };
    run();
  }, [fetchAndSeed]);

  if (!user) return null;

  const hasAccess = (courseType: string) => {
    if (user.role === "admin" || user.role === "paid") return true;
    return courseType === "free";
  };

  // Upgrade user's tier to Paid using real Razorpay Checkout
  const handleUpgrade = async (planId: string) => {
    if (!firebaseUser) return;
    setIsUpgrading(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const planAmount = planId === "premium_monthly" ? 999 : 7999;
      const planName = planId === "premium_monthly" ? "Premium Monthly" : "Premium Yearly";

      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          amount: planAmount,
          currency: "INR"
        })
      });

      if (!res.ok) {
        throw new Error("Failed to initialize payment gateway order.");
      }

      const orderData = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "NextGen Academy",
        description: `${planName} Subscription`,
        order_id: orderData.id,
        handler: async (response: any) => {
          setIsUpgrading(true);
          try {
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
                amount: planAmount,
                currency: "INR",
                plan: planId
              })
            });

            if (verifyRes.ok) {
              await refreshUser();
              setUpgradeSuccess(true);
              setTimeout(() => {
                setUpgradeSuccess(false);
                setUpgradeCourse(null);
                fetchAndSeed();
              }, 2000);
            } else {
              alert("Payment verification failed. Please try again.");
            }
          } catch (err) {
            console.error("Verification Call Failed:", err);
          } finally {
            setIsUpgrading(false);
          }
        },
        prefill: {
          name: user.fullName,
          email: user.email,
        },
        theme: {
          color: "#2563EB"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay trigger error:", err);
      alert(err.message || "Failed to initiate payment. Please try again.");
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
    <div className="space-y-8 animate-fade-in text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">Academy Courses</h1>
          <p className="text-sm text-slate-500 mt-1">Acquire verified certificates, specialized training modules, and executive learning path guides.</p>
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
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 max-w-sm shadow-sm">
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
                  : "text-slate-600 hover:text-slate-900"
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
                  : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-350 shadow-sm"
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
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-portal-primary text-sm shadow-sm"
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
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-portal-primary/40 hover:scale-[1.01] hover:shadow-md transition-all duration-300 flex flex-col justify-between group h-[420px] shadow-sm"
            >
              {/* Thumbnail banner */}
              <div className="h-44 overflow-hidden relative border-b border-slate-100">
                <img
                  src={c.thumbnail}
                  alt={c.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/10 transition-colors"></div>
                
                {/* Category badge absolute */}
                <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900/75 text-white border border-white/10 backdrop-blur-sm">
                  {c.category}
                </span>

                {/* Level Access Lock Badge */}
                <span className={`absolute top-4 right-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-sm ${
                  c.type === "free"
                    ? "bg-emerald-600 text-white border-emerald-500/20"
                    : "bg-amber-500 text-white border-amber-400/20"
                }`}>
                  {c.type === "free" ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  <span>{c.type}</span>
                </span>
              </div>

              {/* Course Info details */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-portal-primary transition-colors duration-200 line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {c.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 text-xs text-slate-500 border-t border-slate-100 pt-4">
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
                    className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-amber-500 animate-pulse" />
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
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => { if (!isUpgrading && !upgradeSuccess) setUpgradeCourse(null); }}></div>

          <div className="relative w-full max-w-md bg-white border border-slate-250 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in z-10 text-slate-900 overflow-hidden">
            {/* Background highlights */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-50/50 rounded-full blur-2xl"></div>

            <button
              onClick={() => setUpgradeCourse(null)}
              disabled={isUpgrading || upgradeSuccess}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30"
            >
              <X className="w-5 h-5" />
            </button>

            {upgradeSuccess ? (
              <div className="py-8 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Upgrade Successful!</h3>
                <p className="text-sm text-slate-500">Welcome to Premium Learning. Unlocking course content...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-portal-primary mx-auto">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">Unlock Premium Learning</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Choose the subscription tier that best fits your engineering or industrial skill building path.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select a Plan</p>
                  
                  {/* Monthly Plan */}
                  <label className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedPlanId === "premium_monthly" 
                      ? "bg-blue-50 border-blue-500" 
                      : "bg-white border-slate-200 hover:border-slate-350 shadow-sm"
                  }`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="plan" 
                        checked={selectedPlanId === "premium_monthly"} 
                        onChange={() => setSelectedPlanId("premium_monthly")} 
                        className="text-portal-primary focus:ring-portal-primary"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Premium Monthly</p>
                        <p className="text-[10px] text-slate-500">Billed month-to-month</p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900">₹999/mo</span>
                  </label>

                  {/* Yearly Plan */}
                  <label className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedPlanId === "premium_yearly" 
                      ? "bg-blue-50 border-blue-500" 
                      : "bg-white border-slate-200 hover:border-slate-350 shadow-sm"
                  }`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="plan" 
                        checked={selectedPlanId === "premium_yearly"} 
                        onChange={() => setSelectedPlanId("premium_yearly")} 
                        className="text-portal-primary focus:ring-portal-primary"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900">Premium Yearly</p>
                          <span className="bg-portal-primary/10 text-portal-primary text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">Save 33%</span>
                        </div>
                        <p className="text-[10px] text-slate-500">Best value subscription</p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900">₹7,999/yr</span>
                  </label>

                  {/* Corporate Plan */}
                  <label className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedPlanId === "corporate" 
                      ? "bg-blue-50 border-blue-500" 
                      : "bg-white border-slate-200 hover:border-slate-350 shadow-sm"
                  }`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="plan" 
                        checked={selectedPlanId === "corporate"} 
                        onChange={() => setSelectedPlanId("corporate")} 
                        className="text-portal-primary focus:ring-portal-primary"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Corporate Enterprise</p>
                        <p className="text-[10px] text-slate-500">Bulk seat licenses & SLA</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600">Custom</span>
                  </label>
                </div>

                <div className="space-y-3 pt-2">
                  {selectedPlanId === "corporate" ? (
                    <Link
                      href="/portal/support"
                      className="w-full py-3.5 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Contact Corporate Support</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(selectedPlanId)}
                      disabled={isUpgrading}
                      className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
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
                  )}
                  <button
                    type="button"
                    onClick={() => setUpgradeCourse(null)}
                    disabled={isUpgrading}
                    className="w-full py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all disabled:opacity-50"
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
