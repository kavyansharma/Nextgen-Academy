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
  FileText,
  Plus,
  Trash2,
  Edit,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowLeft,
  FileDown
} from "lucide-react";

interface ResourceDoc {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  accessLevel: string; // 'free' | 'paid'
  driveLink: string;
  createdAt: string;
  tags?: string[];
  downloadCount?: number;
}

export default function AdminResourcesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Lists
  const [resources, setResources] = useState<ResourceDoc[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals / Form toggles
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<ResourceDoc | null>(null);

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [accessLevel, setAccessLevel] = useState<"free" | "paid">("free");
  const [driveLink, setDriveLink] = useState("");
  const [tagsString, setTagsString] = useState("");
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Upload & submission states
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAccess, setFilterAccess] = useState("all");

  // Route protection
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/portal/login");
      } else if (user.role !== "admin") {
        router.replace("/portal/dashboard");
      }
    }
  }, [user, loading, router]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadResources = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    try {
      setLoadingData(true);
      const list = await queryDocuments("resources") as ResourceDoc[];
      setResources(list);
    } catch (err) {
      console.error("Error loading resources directory:", err);
      showToast("error", "Failed to retrieve resources folder.");
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      loadResources();
    };
    run();
  }, [loadResources]);

  if (!user || user.role !== "admin") return null;

  // Add Resource
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !description.trim() || !category.trim() || !driveLink.trim()) {
      setFormError("All fields are required (including PDF link or uploaded file).");
      return;
    }
    setSubmitting(true);
    try {
      const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const tags = tagsString.split(",").map(t => t.trim()).filter(t => t.length > 0);
      const resId = await addDocument("resources", {
        title: title.trim(),
        slug,
        description: description.trim(),
        category: category.trim(),
        accessLevel,
        driveLink: driveLink.trim(),
        tags,
        downloadCount: Number(downloadCount) || 0
      });
      await logAdminAction(user.uid, user.email || "", "CREATE_RESOURCE", `Created resource: ${title.trim()} (${accessLevel}) with ID ${resId}`);
      showToast("success", "Resource successfully added!");
      setIsAddOpen(false);
      
      // Reset
      setTitle("");
      setDescription("");
      setCategory("");
      setAccessLevel("free");
      setDriveLink("");
      setTagsString("");
      setDownloadCount(0);
      loadResources();
    } catch (err) {
      console.error("Error adding resource:", err);
      setFormError("Failed to save resource to database.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Form
  const handleOpenEdit = (res: ResourceDoc) => {
    setResourceToEdit(res);
    setTitle(res.title);
    setDescription(res.description);
    setCategory(res.category);
    setAccessLevel(res.accessLevel as any || "free");
    setDriveLink(res.driveLink || "");
    setTagsString(res.tags ? res.tags.join(", ") : "");
    setDownloadCount(res.downloadCount || 0);
    setFormError(null);
  };

  // Edit Resource
  const handleEditResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!resourceToEdit) return;

    if (!title.trim() || !description.trim() || !category.trim() || !driveLink.trim()) {
      setFormError("All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const tags = tagsString.split(",").map(t => t.trim()).filter(t => t.length > 0);
      await updateDocument("resources", resourceToEdit.id, {
        title: title.trim(),
        slug,
        description: description.trim(),
        category: category.trim(),
        accessLevel,
        driveLink: driveLink.trim(),
        tags,
        downloadCount: Number(downloadCount) || 0
      });
      await logAdminAction(user.uid, user.email || "", "UPDATE_RESOURCE", `Updated resource metadata for: ${title.trim()} (${resourceToEdit.id})`);
      showToast("success", "Resource updated successfully!");
      setResourceToEdit(null);
      
      // Reset
      setTitle("");
      setDescription("");
      setCategory("");
      setAccessLevel("free");
      setDriveLink("");
      setTagsString("");
      setDownloadCount(0);
      loadResources();
    } catch (err) {
      console.error("Error updating resource:", err);
      setFormError("Failed to update resource.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Resource
  const handleDeleteResource = async (rId: string, rTitle: string) => {
    if (!confirm(`Are you sure you want to delete resource "${rTitle}"?`)) return;
    try {
      await deleteDocument("resources", rId);
      await logAdminAction(user.uid, user.email || "", "DELETE_RESOURCE", `Deleted resource: ${rTitle} (${rId})`);
      showToast("success", "Resource deleted successfully.");
      loadResources();
    } catch (err) {
      console.error("Error deleting resource:", err);
      showToast("error", "Failed to delete resource.");
    }
  };

  // Filter lists
  const filteredResources = resources.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase().trim());

    const matchesAccess = filterAccess === "all" || r.accessLevel === filterAccess;
    return matchesSearch && matchesAccess;
  });

  return (
    <div className="space-y-6 animate-fade-in text-portal-text-primary">
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
      <div className="border-b border-portal-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-portal-text-primary tracking-tight sm:text-4xl flex items-center gap-2">
            <FileText className="w-8 h-8 text-portal-primary" />
            <span>Resource Manager</span>
          </h1>
          <p className="text-sm text-portal-text-secondary mt-1">Upload technical guides, publish cheat sheets, set premium boundaries, and audit drive items.</p>
        </div>

        <button
          onClick={() => {
            setTitle("");
            setDescription("");
            setCategory("");
            setAccessLevel("free");
            setDriveLink("");
            setTagsString("");
            setDownloadCount(0);
            setFormError(null);
            setIsAddOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-portal-text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Resource file</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex gap-3 p-4 rounded-xl text-sm border shadow-lg animate-fade-in ${
          toast.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 border border-portal-border rounded-2xl">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-portal-text-secondary">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search resources by title, category, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-portal-border text-portal-text-primary placeholder-portal-text-secondary focus:outline-none focus:border-portal-primary focus:ring-1 focus:ring-portal-primary text-sm"
          />
        </div>

        {/* Access Selector dropdown */}
        <div className="w-full md:w-48">
          <select
            value={filterAccess}
            onChange={(e) => setFilterAccess(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-portal-border text-portal-text-secondary focus:outline-none focus:border-portal-primary text-sm cursor-pointer"
          >
            <option value="all">All Access Levels</option>
            <option value="free">Free Access</option>
            <option value="paid">Premium Access Only</option>
          </select>
        </div>
      </div>

      {/* Resources Table */}
      <div className="overflow-x-auto bg-white border border-portal-border shadow-xl rounded-2xl">
        {loadingData ? (
          <div className="p-12 text-center text-portal-text-secondary">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-portal-primary mb-3" />
            <span>Loading document folders...</span>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="p-12 text-center text-portal-text-secondary space-y-2">
            <FileText className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="font-bold text-portal-text-primary">No Resources Found</p>
            <p className="text-sm">We couldn&apos;t find any resources matching your query.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-portal-border text-xs font-bold text-portal-text-secondary uppercase tracking-wider bg-slate-50/45">
                <th className="p-4.5 pl-6">Document Title</th>
                <th className="p-4.5">Category</th>
                <th className="p-4.5">Access Level</th>
                <th className="p-4.5">Drive File Link</th>
                <th className="p-4.5 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResources.map((res) => {
                const badgeColor =
                  res.accessLevel === "paid"
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700";

                return (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors duration-150">
                    {/* Title */}
                    <td className="p-4.5 pl-6">
                      <div className="font-bold text-portal-text-primary flex items-center gap-2">
                        <FileDown className="w-4 h-4 text-portal-primary" />
                        <span>{res.title}</span>
                      </div>
                      <p className="text-xs text-portal-text-secondary line-clamp-1 mt-0.5 max-w-sm">{res.description}</p>
                    </td>

                    {/* Category */}
                    <td className="p-4.5 text-portal-text-secondary">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-50 border border-portal-border">
                        {res.category}
                      </span>
                    </td>

                    {/* Access Level */}
                    <td className="p-4.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                        {res.accessLevel === "paid" ? "premium" : "free"}
                      </span>
                    </td>

                    {/* Link */}
                    <td className="p-4.5 text-portal-text-secondary truncate max-w-xs font-mono text-xs">
                      <a href={res.driveLink} target="_blank" rel="noopener noreferrer" className="hover:text-portal-secondary underline transition-all">
                        {res.driveLink}
                      </a>
                    </td>

                    {/* Actions */}
                    <td className="p-4.5 pr-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(res)}
                        className="inline-flex p-2 rounded-lg bg-white border border-portal-border text-portal-secondary hover:text-portal-primary hover:border-portal-primary transition-all cursor-pointer"
                        title="Edit Resource"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteResource(res.id, res.title)}
                        className="inline-flex p-2 rounded-lg bg-slate-50 border border-portal-border text-red-400 hover:text-portal-primary hover:bg-red-500/15 transition-all cursor-pointer"
                        title="Delete Resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* CRUD Modal Form */}
      {(isAddOpen || resourceToEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-50/70 backdrop-blur-sm" onClick={() => { if (!submitting) { setIsAddOpen(false); setResourceToEdit(null); } }}></div>
          
          <form
            onSubmit={resourceToEdit ? handleEditResource : handleAddResource}
            className="relative w-full max-w-lg bg-white border border-portal-border rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-portal-text-primary space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-portal-border pb-3">
              <h3 className="text-lg font-bold text-portal-text-primary">{resourceToEdit ? "Modify Resource details" : "Publish Resource PDF"}</h3>
              <button
                type="button"
                onClick={() => { setIsAddOpen(false); setResourceToEdit(null); }}
                className="p-1.5 rounded-lg text-portal-text-secondary hover:text-portal-primary"
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
                <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Document Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. DMAIC Quality Playbook"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Description Abstract</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Provide a summary of the guide details..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Category</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Strategy"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Access Boundary</label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary text-sm cursor-pointer"
                  >
                    <option value="free">Free Access</option>
                    <option value="paid">Premium Tier (Paid/Admin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Asset Document File</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    placeholder="URL address or upload below..."
                    className="flex-grow flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary text-sm font-mono text-xs"
                  />
                  <label className="px-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border hover:border-portal-primary text-xs font-bold text-portal-primary flex items-center justify-center cursor-pointer transition-all hover:bg-slate-850">
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
                          const downloadUrl = await uploadFile(file, `resources/${Date.now()}_${file.name}`);
                          setDriveLink(downloadUrl);
                          showToast("success", "Resource PDF uploaded successfully!");
                        } catch (err: any) {
                          console.error("Error uploading resource file:", err);
                          showToast("error", "Failed to upload file to storage.");
                        } finally {
                          setUploadingPdf(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    value={tagsString}
                    onChange={(e) => setTagsString(e.target.value)}
                    placeholder="e.g. Lean Six Sigma, Automation"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Download Count Override</label>
                  <input
                    type="number"
                    value={downloadCount}
                    onChange={(e) => setDownloadCount(Number(e.target.value))}
                    min={0}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-portal-border">
              <button
                type="button"
                onClick={() => { setIsAddOpen(false); setResourceToEdit(null); }}
                className="flex-grow flex-1 py-3 rounded-xl border border-portal-border hover:bg-slate-50 text-xs font-bold text-portal-text-secondary transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-grow flex-1 py-3 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-portal-text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                <span>{resourceToEdit ? "Save Changes" : "Publish Document"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
