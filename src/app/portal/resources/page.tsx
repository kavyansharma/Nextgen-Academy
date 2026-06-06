"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { resources as staticResources } from "@/data/resources";
import { queryDocuments, addDocument, setDocument } from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";
import {
  Search,
  ExternalLink,
  FileText,
  Lock,
  Unlock,
  Loader2,
  Download,
  Eye,
  X,
  SlidersHorizontal,
  Bookmark
} from "lucide-react";

interface ResourceDoc {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  accessLevel: string; // 'free' | 'paid'
  driveLink: string;
  createdAt?: string;
  tags?: string[];
  downloadCount?: number;
}

const CATEGORIES = [
  "All",
  "Documents",
  "PDFs",
  "Templates",
  "Recordings",
  "Downloads"
];

const getUICategory = (res: { category: string; driveLink?: string; fileUrl?: string; tags?: string[]; title?: string }): string => {
  const cat = (res.category || "").trim().toLowerCase();
  if (["documents", "pdfs", "templates", "recordings", "downloads"].includes(cat)) {
    return res.category.trim();
  }
  if (cat === "industrial engineering" || cat === "lean six sigma" || cat === "quality management") {
    return "PDFs";
  }
  if (cat === "automation" || cat === "downloads") {
    return "Downloads";
  }
  
  // Map based on file URL/link, tags, or title
  const fileUrl = (res.driveLink || res.fileUrl || "").toLowerCase();
  const tags = (res.tags || []).map(t => t.toLowerCase());
  const title = (res.title || "").toLowerCase();
  
  if (fileUrl.endsWith(".pdf") || tags.includes("pdf") || title.includes("pdf")) {
    return "PDFs";
  }
  if (
    fileUrl.includes("drive.google.com") || 
    fileUrl.includes("docs.google.com") || 
    tags.includes("template") ||
    tags.includes("framework") ||
    title.includes("template") ||
    title.includes("framework")
  ) {
    return "Templates";
  }
  if (
    fileUrl.includes("youtube.com") || 
    fileUrl.includes("vimeo.com") || 
    fileUrl.includes("mp4") || 
    tags.includes("recording") ||
    tags.includes("video") ||
    title.includes("recording") ||
    title.includes("video")
  ) {
    return "Recordings";
  }
  if (
    fileUrl.includes("download") || 
    fileUrl.includes("zip") || 
    fileUrl.includes("api/resources") ||
    tags.includes("download")
  ) {
    return "Downloads";
  }
  
  return "Documents";
};

export default function ResourcesPage() {
  const { user, loading } = useAuth();
  const [resources, setResources] = useState<ResourceDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"popularity" | "title">("popularity");
  const [previewResource, setPreviewResource] = useState<ResourceDoc | null>(null);

  // Fetch and seed resources
  const fetchResources = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingDocs(true);
      const constraints = (user.role === "admin" || user.role === "paid" || user.role === "resource_access")
        ? []
        : [where("accessLevel", "==", "free")];
      const list = await queryDocuments("resources", ...constraints) as ResourceDoc[];

      if (list.length === 0) {
        console.log("No resources found in Firestore. Seeding static files...");
        if (user.role === "admin") {
          for (const res of staticResources) {
            await setDocument("resources", res.id, {
              id: res.id,
              title: res.title,
              slug: res.slug,
              description: res.description,
              category: res.category,
              accessLevel: res.type, // 'free' | 'paid'
              driveLink: res.fileUrl,
              tags: res.tags || [],
              downloadCount: res.downloadCount || 0
            });
          }
          const seededList = await queryDocuments("resources", ...constraints) as ResourceDoc[];
          setResources(seededList);
        } else {
          // Fallback to static data for non-admin users so they see values immediately
          const filteredStatic = staticResources.filter(res => {
            if (user.role === "paid" || user.role === "resource_access") return true;
            return res.type === "free";
          });
          setResources(filteredStatic.map(res => ({
            id: res.id,
            slug: res.slug,
            title: res.title,
            description: res.description,
            category: res.category,
            accessLevel: res.type,
            driveLink: res.fileUrl,
            tags: res.tags || [],
            downloadCount: res.downloadCount || 0
          })));
        }
      } else {
        setResources(list);
      }
    } catch (err) {
      console.error("Error fetching resources:", err);
    } finally {
      setLoadingDocs(false);
    }
  }, [user]);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      fetchResources();
    };
    run();
  }, [fetchResources]);

  // Check if current user has access to this resource level
  const hasAccess = (type: string) => {
    if (!user) return false;
    const cleanType = type.toLowerCase().trim();
    if (user.role === "admin") return true;
    if (user.role === "paid" || user.role === "resource_access") return cleanType === "free" || cleanType === "paid";
    return cleanType === "free";
  };

  // Apply search & tag filters
  const filteredResources = resources.filter(res => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      res.title.toLowerCase().includes(query) ||
      res.description.toLowerCase().includes(query) ||
      (res.tags && res.tags.some(tag => tag.toLowerCase().includes(query)));

    const matchesCategory =
      selectedCategory === "All" ||
      getUICategory(res).toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Sort resources
  const sortedResources = [...filteredResources].sort((a, b) => {
    if (sortBy === "popularity") {
      return (b.downloadCount || 0) - (a.downloadCount || 0);
    } else if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  if (loading || loadingDocs || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-portal-bg text-portal-text-primary">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 border-4 border-portal-primary border-t-transparent rounded-full animate-spin mx-auto text-portal-primary" />
          <p className="text-portal-text-secondary text-sm tracking-wide">Validating permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">Learning Resources</h1>
          <p className="text-sm text-slate-500 mt-1">Access technical guides, operational playbooks, and corporate frameworks.</p>
        </div>

        {user.role === "admin" && (
          <Link
            href="/portal/admin/resources"
            className="px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <span>Manage Resources</span>
          </Link>
        )}
      </div>

      {/* Search & Sort & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by title, description or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-portal-primary focus:ring-1 focus:ring-portal-primary transition-all duration-200 text-sm shadow-sm"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 self-start md:self-auto shadow-sm">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-semibold">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "popularity" | "title")}
            className="bg-transparent text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
          >
            <option value="popularity">Popularity (Downloads)</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills (Desktop and Mobile) */}
      <div className="flex flex-wrap gap-2 pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer ${
              selectedCategory.toLowerCase() === cat.toLowerCase()
                ? "bg-portal-primary text-white border-portal-primary shadow-md shadow-portal-primary/20"
                : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      {sortedResources.length === 0 ? (
        <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center max-w-xl mx-auto space-y-6 shadow-sm">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 items-center justify-center text-portal-primary">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">No Resources Found</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              We couldn&apos;t find any resources matching your search query or selected category filter.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all shadow-sm cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedResources.map((res) => {
            const userHasAccess = hasAccess(res.accessLevel);
            const accessBadgeColor =
              res.accessLevel.toLowerCase() === "free"
                ? "bg-emerald-50 border-emerald-200 text-emerald-750"
                : "bg-amber-50 border-amber-200 text-amber-750";

            return (
              <div
                key={res.id}
                className={`bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:border-portal-primary/40 hover:shadow-md hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group h-[340px] shadow-sm ${
                  !userHasAccess ? "opacity-90 hover:opacity-100" : ""
                }`}
              >
                {/* Subtle hover gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-portal-primary/5 to-portal-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div className="space-y-4 relative z-10">
                  {/* Header: Category & Access Badge */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-150">
                      {getUICategory(res)}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${accessBadgeColor}`}>
                      {res.accessLevel.toLowerCase() === "free" ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                      <span>{res.accessLevel}</span>
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3 mt-2">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-portal-primary group-hover:scale-105 transition-transform flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-portal-primary transition-colors duration-200 line-clamp-2 mt-0.5" title={res.title}>
                      {res.title}
                    </h2>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-550 leading-relaxed line-clamp-3">
                    {res.description}
                  </p>

                  {/* Tags Badges */}
                  {res.tags && res.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {res.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-medium bg-slate-50 text-slate-600 border border-slate-150 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer details & Action */}
                <div className="pt-4 relative z-10 flex items-center justify-between gap-4 border-t border-slate-100 mt-3">
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                    <Download className="w-3.5 h-3.5 text-portal-primary" />
                    <span>{res.downloadCount || 0} downloads</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Preview Button */}
                    <button
                      onClick={() => setPreviewResource(res)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
                      title="Quick Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Open Resource */}
                    {userHasAccess ? (
                      <Link
                        href={`/resources/${res.slug || res.id}`}
                        className="py-2.5 px-4 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <button
                        className="py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                        onClick={() => alert("Premium subscription required! Upgrade your plan via a premium course.")}
                      >
                        <Lock className="w-3 h-3 text-amber-550" />
                        <span>Locked</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setPreviewResource(null)}></div>
          
          <div className="relative w-full max-w-lg bg-white border border-slate-250 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in z-10 text-slate-900">
            <button
              onClick={() => setPreviewResource(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                  {getUICategory(previewResource)}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  previewResource.accessLevel.toLowerCase() === "free"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                }`}>
                  {previewResource.accessLevel}
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-portal-primary flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-snug">{previewResource.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{previewResource.downloadCount || 0} times downloaded</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Overview</h4>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  {previewResource.description}
                </p>
              </div>

              {previewResource.tags && previewResource.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {previewResource.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-655 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setPreviewResource(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  Close Preview
                </button>
                {hasAccess(previewResource.accessLevel) ? (
                  <Link
                    href={`/resources/${previewResource.slug || previewResource.id}`}
                    className="flex-1 py-3 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Access Resource</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    onClick={() => alert("Upgrade to Paid membership to unlock this premium resource! Select any premium course to process.")}
                    className="flex-grow flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Unlock Premium</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
