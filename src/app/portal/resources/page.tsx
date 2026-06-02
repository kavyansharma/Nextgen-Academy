"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments } from "@/lib/services/firestoreService";
import { 
  Search, 
  ExternalLink, 
  FileText, 
  ArrowLeft,
  FolderOpen,
  Lock,
  Unlock,
  ShieldAlert,
  Loader2
} from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  accessLevel: string;
  driveLink: string;
  createdAt: string;
}

export default function ResourcesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Resources state
  const [resources, setResources] = useState<Resource[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Protection redirect
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/portal/login");
    }
  }, [user, loading, router]);

  // Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setFetchLoading(true);
        setFetchError(null);
        
        const docs = await queryDocuments("resources");
        const formatted: Resource[] = docs.map((doc: any) => ({
          id: doc.id,
          title: doc.title || "",
          description: doc.description || "",
          category: doc.category || "General",
          accessLevel: doc.accessLevel || "free",
          driveLink: doc.driveLink || "#",
          createdAt: doc.createdAt || new Date().toISOString()
        }));

        setResources(formatted);
      } catch (err: any) {
        console.error("Error fetching resources:", err);
        setFetchError("Unable to fetch resources. Please check your database permissions.");
      } finally {
        setFetchLoading(false);
      }
    };

    if (user) {
      fetchResources();
    }
  }, [user]);

  // Check if current user has access to this resource level
  const hasAccess = (accessLevel: string) => {
    if (!user) return false;
    const cleanLevel = accessLevel.toLowerCase().trim();
    if (user.role === "admin") return true;
    if (user.role === "paid") return cleanLevel === "free" || cleanLevel === "paid";
    return cleanLevel === "free"; // Free users only see free level
  };

  // Compile list of resources user can see
  const accessibleResources = resources.filter(res => hasAccess(res.accessLevel));

  // Compute unique categories from the accessible list
  const categories = ["All", ...Array.from(new Set(accessibleResources.map(res => res.category)))];

  // Apply search & category filters
  const filteredResources = accessibleResources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesCategory = selectedCategory === "All" || res.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  if (loading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-brand-dark">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto text-brand-orange" />
          <p className="text-brand-text-muted text-sm tracking-wide">Validating permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 bg-brand-dark overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto z-10 relative space-y-8 animate-fade-in">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-2">
            <Link 
              href="/portal/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text-muted hover:text-brand-orange transition-colors duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Academy Resources</h1>
            <p className="text-sm text-brand-text-muted">Access exclusive talent guides, training videos, and corporate assessments.</p>
          </div>

          {/* User role indicator */}
          <div className="flex items-center gap-2 self-start md:self-center bg-slate-900 border border-slate-800 rounded-full px-4 py-2">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse"></div>
            <span className="text-xs text-slate-300 font-medium">Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
          </div>
        </div>

        {fetchError && (
          <div className="flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
            <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Search & Category Filter Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search resources by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-sm"
              />
            </div>

            {/* Category selection - Desktop Badges */}
            <div className="hidden md:flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? "bg-brand-orange text-white border-brand-orange shadow-lg shadow-brand-orange/20"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Category selection - Mobile Selector */}
            <div className="block md:hidden">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    Category: {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        {fetchLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 glass animate-pulse space-y-6 h-64">
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-slate-800 rounded w-20"></div>
                  <div className="h-6 bg-slate-800 rounded w-16"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-6 bg-slate-800 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                </div>
                <div className="h-10 bg-slate-800 rounded-xl w-full pt-4"></div>
              </div>
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          /* Empty State */
          <div className="p-16 rounded-3xl bg-slate-900/60 border border-slate-800/80 text-center glass max-w-xl mx-auto space-y-6">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 items-center justify-center text-brand-orange">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">No Resources Found</h2>
              <p className="text-sm text-brand-text-muted leading-relaxed">
                {resources.length === 0
                  ? "We couldn't find any learning materials in the portal. New resources will be published shortly."
                  : "We couldn't find any resources matching your search query or selected category filter."}
              </p>
            </div>
            {resources.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-brand-orange text-xs font-semibold text-slate-300 hover:text-white transition-all duration-200 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResources.map((res) => {
              const accessColor = 
                res.accessLevel.toLowerCase() === "free"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : res.accessLevel.toLowerCase() === "paid"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400";

              return (
                <div 
                  key={res.id}
                  className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 glass flex flex-col justify-between hover:border-brand-orange/30 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group h-80"
                >
                  {/* Subtle hover gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/5 to-brand-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  <div className="space-y-4 relative z-10">
                    {/* Header: Category & Access Badge */}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-950/60 text-brand-blue border border-slate-800/80">
                        {res.category}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${accessColor}`}>
                        {res.accessLevel.toLowerCase() === "free" ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                        <span>{res.accessLevel}</span>
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-start gap-3 mt-2">
                      <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-brand-orange group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h2 className="text-lg font-bold text-white group-hover:text-brand-orange transition-colors duration-200 line-clamp-2 mt-0.5">
                        {res.title}
                      </h2>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-brand-text-muted leading-relaxed line-clamp-3">
                      {res.description}
                    </p>
                  </div>

                  {/* Open Link Button */}
                  <div className="pt-4 relative z-10">
                    <a
                      href={res.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-brand-orange text-slate-200 font-semibold transition-all duration-300 hover:scale-[1.02] text-center flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      <span>Open Resource</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
