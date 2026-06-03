"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { 
  queryDocuments, 
  addDocument, 
  updateDocument, 
  deleteDocument 
} from "@/lib/services/firestoreService";
import { 
  Users, 
  UserCheck, 
  Shield, 
  FileText, 
  Settings, 
  Search, 
  Trash2, 
  Edit3, 
  Plus, 
  X, 
  Lock, 
  Unlock, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  UserX, 
  Loader2,
  Calendar,
  Mail,
  Activity,
  CreditCard,
  Award
} from "lucide-react";

interface FirestoreUser {
  uid: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  accessLevel: string;
  driveLink: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "resources">("overview");

  // Fetch States
  const [usersList, setUsersList] = useState<FirestoreUser[]>([]);
  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Global Notification
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search & Filter States
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState("all");
  const [resourceAccessFilter, setResourceAccessFilter] = useState("all");

  // Modals States
  const [userToDelete, setUserToDelete] = useState<FirestoreUser | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<Resource | null>(null);

  // Form States (Add Resource)
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newAccessLevel, setNewAccessLevel] = useState("free");
  const [newDriveLink, setNewDriveLink] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submittingForm, setSubmittingForm] = useState(false);

  // Form States (Edit Resource)
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAccessLevel, setEditAccessLevel] = useState("free");
  const [editDriveLink, setEditDriveLink] = useState("");

  // Access Control Redirect
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/portal/login");
      } else if (user.role !== "admin") {
        router.replace("/portal/dashboard");
      }
    }
  }, [user, loading, router]);

  // Fetch Data
  const fetchData = async () => {
    try {
      setFetchLoading(true);
      const [fetchedUsers, fetchedResources] = await Promise.all([
        queryDocuments("users"),
        queryDocuments("resources")
      ]);

      const formattedUsers = fetchedUsers.map((u: any) => ({
        uid: u.uid || u.id || "",
        fullName: u.fullName || "",
        username: u.username || "",
        email: u.email || "",
        role: u.role || "free",
        createdAt: u.createdAt || new Date().toISOString()
      }));

      const formattedResources = fetchedResources.map((r: any) => ({
        id: r.id || "",
        title: r.title || "",
        description: r.description || "",
        category: r.category || "General",
        accessLevel: r.accessLevel || "free",
        driveLink: r.driveLink || "#",
        createdAt: r.createdAt || new Date().toISOString()
      }));

      setUsersList(formattedUsers);
      setResourcesList(formattedResources);
    } catch (err) {
      console.error("Admin Fetch Error:", err);
      showNotification("error", "Failed to retrieve directory data from Firestore.");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchData();
    }
  }, [user]);

  // Helper for notification
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Helper: Valid URL check
  const isValidUrl = (urlStr: string) => {
    try {
      new URL(urlStr);
      return true;
    } catch {
      return false;
    }
  };

  // USER MANAGEMENT ACTIONS

  // Update Role
  const handleUpdateRole = async (targetUid: string, newRole: string) => {
    // Safety check: Cannot modify own role
    if (targetUid === user?.uid) {
      showNotification("error", "Safety Lock: You cannot remove your own administrator status.");
      return;
    }

    try {
      await updateDocument("users", targetUid, { role: newRole });
      showNotification("success", `User role elevated/demoted to ${newRole} successfully.`);
      
      // Update local state to avoid refetching
      setUsersList(prev => prev.map(u => u.uid === targetUid ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error("Error updating user role:", err);
      showNotification("error", "Failed to update user role.");
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    // Safety check: Cannot delete own account
    if (userToDelete.uid === user?.uid) {
      showNotification("error", "Safety Lock: You cannot delete your own administrator account.");
      setUserToDelete(null);
      return;
    }

    try {
      await deleteDocument("users", userToDelete.uid);
      showNotification("success", `User account @${userToDelete.username} deleted from directory.`);
      
      // Update local state
      setUsersList(prev => prev.filter(u => u.uid !== userToDelete.uid));
    } catch (err) {
      console.error("Error deleting user:", err);
      showNotification("error", "Failed to delete user profile.");
    } finally {
      setUserToDelete(null);
    }
  };

  // RESOURCE MANAGEMENT ACTIONS

  // Add Resource
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!newTitle.trim() || !newDescription.trim() || !newCategory.trim() || !newDriveLink.trim()) {
      setFormError("All fields are required.");
      return;
    }

    if (!isValidUrl(newDriveLink.trim())) {
      setFormError("Please enter a valid URL (including http/https).");
      return;
    }

    setSubmittingForm(true);

    try {
      const payload = {
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory.trim(),
        accessLevel: newAccessLevel,
        driveLink: newDriveLink.trim()
      };

      const newId = await addDocument("resources", payload);
      showNotification("success", "Resource successfully added to academy repository.");
      
      // Reset States
      setNewTitle("");
      setNewDescription("");
      setNewCategory("");
      setNewAccessLevel("free");
      setNewDriveLink("");
      setIsAddResourceOpen(false);

      // Refresh list
      fetchData();
    } catch (err) {
      console.error("Error adding resource:", err);
      setFormError("Failed to add resource. Please verify write permissions.");
    } finally {
      setSubmittingForm(false);
    }
  };

  // Edit Resource (Init Form)
  const openEditResource = (resource: Resource) => {
    setResourceToEdit(resource);
    setEditTitle(resource.title);
    setEditDescription(resource.description);
    setEditCategory(resource.category);
    setEditAccessLevel(resource.accessLevel);
    setEditDriveLink(resource.driveLink);
    setFormError(null);
  };

  // Edit Resource Submit
  const handleEditResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!resourceToEdit) return;

    // Validation
    if (!editTitle.trim() || !editDescription.trim() || !editCategory.trim() || !editDriveLink.trim()) {
      setFormError("All fields are required.");
      return;
    }

    if (!isValidUrl(editDriveLink.trim())) {
      setFormError("Please enter a valid URL (including http/https).");
      return;
    }

    setSubmittingForm(true);

    try {
      const payload = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory.trim(),
        accessLevel: editAccessLevel,
        driveLink: editDriveLink.trim()
      };

      await updateDocument("resources", resourceToEdit.id, payload);
      showNotification("success", "Resource successfully updated.");
      setResourceToEdit(null);
      
      // Refresh list
      fetchData();
    } catch (err) {
      console.error("Error editing resource:", err);
      setFormError("Failed to update resource document.");
    } finally {
      setSubmittingForm(false);
    }
  };

  // Delete Resource
  const handleDeleteResource = async () => {
    if (!resourceToDelete) return;

    try {
      await deleteDocument("resources", resourceToDelete.id);
      showNotification("success", "Resource removed from database successfully.");
      
      // Update local state
      setResourcesList(prev => prev.filter(r => r.id !== resourceToDelete.id));
    } catch (err) {
      console.error("Error deleting resource:", err);
      showNotification("error", "Failed to delete resource document.");
    } finally {
      setResourceToDelete(null);
    }
  };

  // FILTERING LOGIC

  // Filter Users
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = 
      u.fullName.toLowerCase().includes(userSearch.toLowerCase().trim()) || 
      u.email.toLowerCase().includes(userSearch.toLowerCase().trim()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase().trim());
      
    const matchesRole = userRoleFilter === "all" || u.role.toLowerCase() === userRoleFilter.toLowerCase();
    
    return matchesSearch && matchesRole;
  });

  // Filter Resources
  const filteredResources = resourcesList.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(resourceSearch.toLowerCase().trim());
    const matchesCategory = resourceCategoryFilter === "all" || r.category.toLowerCase() === resourceCategoryFilter.toLowerCase();
    const matchesAccess = resourceAccessFilter === "all" || r.accessLevel.toLowerCase() === resourceAccessFilter.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesAccess;
  });

  // Unique categories for resources filter
  const resourceCategories = ["all", ...Array.from(new Set(resourcesList.map(r => r.category)))];

  // STATS DEFINITION
  const totalUsers = usersList.length;
  const freeUsers = usersList.filter(u => u.role === "free").length;
  const paidUsers = usersList.filter(u => u.role === "paid").length;
  const adminUsers = usersList.filter(u => u.role === "admin").length;
  const totalResources = resourcesList.length;

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-brand-dark">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto text-brand-orange" />
          <p className="text-brand-text-muted text-sm tracking-wide">Authorizing admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 bg-brand-dark overflow-hidden text-slate-100">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto z-10 relative space-y-8 animate-fade-in">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-2">
            <Link 
              href="/portal/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text-muted hover:text-brand-orange transition-colors duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl flex items-center gap-3">
              <Settings className="w-8 h-8 text-brand-orange animate-spin-slow" />
              <span>Admin Console</span>
            </h1>
            <p className="text-sm text-brand-text-muted">Manage system directories, user roles, catalog publications, and permissions.</p>
          </div>

          {/* Action indicator */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-2 self-start md:self-center">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-blue animate-pulse"></div>
            <span className="text-xs text-slate-300 font-medium">Console Online</span>
          </div>
        </div>

        {/* Global Notifications */}
        {notification && (
          <div className={`flex gap-3 p-4 rounded-xl text-sm border z-50 animate-fade-in ${
            notification.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200" 
              : "bg-red-500/10 border-red-500/20 text-red-200"
          }`}>
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "users", label: "User Management", icon: Users },
            { id: "resources", label: "Resource Catalog", icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? "border-brand-orange text-brand-orange bg-slate-900/10"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800"
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* LOADING SKELETON */}
        {fetchLoading ? (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto text-brand-orange" />
            <p className="text-brand-text-muted text-sm">Syncing with Firestore database...</p>
          </div>
        ) : (
          <>
            {/* ACTIVE TAB VIEWS */}

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  
                  {/* Total Users */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 shadow-2xl glass hover:border-brand-orange/20 transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</p>
                        <p className="text-3xl font-extrabold text-white">{totalUsers}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Free Users */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 shadow-2xl glass hover:border-emerald-500/20 transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free Users</p>
                        <p className="text-3xl font-extrabold text-white">{freeUsers}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Unlock className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Paid Users */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 shadow-2xl glass hover:border-amber-500/20 transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid Users</p>
                        <p className="text-3xl font-extrabold text-white">{paidUsers}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <UserCheck className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Admins */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 shadow-2xl glass hover:border-brand-blue/20 transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Users</p>
                        <p className="text-3xl font-extrabold text-white">{adminUsers}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-brand-blue/10 border border-brand-blue/20 text-brand-blue">
                        <Shield className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Resources */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 shadow-2xl glass hover:border-purple-500/20 transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resources</p>
                        <p className="text-3xl font-extrabold text-white">{totalResources}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        <FileText className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Management Operations Grid */}
                <div className="space-y-4">
                  <h3 className="font-bold text-white text-lg tracking-tight">Administrative Consoles</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Payments Console */}
                    <Link
                      href="/portal/admin/payments"
                      className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 shadow-md flex items-center gap-4 hover:border-brand-orange/30 hover:bg-slate-900/80 transition-all duration-300 group"
                    >
                      <div className="p-3 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange group-hover:scale-105 transition-transform">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Payments Ledger</h4>
                        <p className="text-xs text-brand-text-muted mt-0.5">Refunds & ledger audit</p>
                      </div>
                    </Link>

                    {/* Subscriptions Console */}
                    <Link
                      href="/portal/admin/subscriptions"
                      className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 shadow-md flex items-center gap-4 hover:border-brand-blue/30 hover:bg-slate-900/80 transition-all duration-300 group"
                    >
                      <div className="p-3 rounded-xl bg-brand-blue/10 border border-brand-blue/20 text-brand-blue group-hover:scale-105 transition-transform">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Subscription Desk</h4>
                        <p className="text-xs text-brand-text-muted mt-0.5">Adjust expiry & cancel</p>
                      </div>
                    </Link>

                    {/* Business Intelligence */}
                    <Link
                      href="/portal/admin/analytics"
                      className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 shadow-md flex items-center gap-4 hover:border-purple-500/30 hover:bg-slate-900/80 transition-all duration-300 group"
                    >
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Analytics Panel</h4>
                        <p className="text-xs text-brand-text-muted mt-0.5">Real-time KPI reports</p>
                      </div>
                    </Link>

                    {/* Advanced Resources */}
                    <Link
                      href="/portal/admin/resources"
                      className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 shadow-md flex items-center gap-4 hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all duration-300 group"
                    >
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Resource Manager</h4>
                        <p className="text-xs text-brand-text-muted mt-0.5">Publish & tag uploads</p>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Overview Info Block */}
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-sm space-y-4">
                  <h3 className="font-bold text-white text-lg">System Metrics Status</h3>
                  <p className="text-brand-text-muted leading-relaxed">
                    The NextGen database contains {totalUsers} user directories and {totalResources} published resource catalog links. Review the user permissions, elevations, or publish new document assets directly using the tabs above.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: USER MANAGEMENT */}
            {activeTab === "users" && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Search / Filter Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-900/40 p-4 border border-slate-850 rounded-2xl">
                  
                  {/* Search Bar */}
                  <div className="relative flex-grow max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search users by name, email, or username..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm"
                    />
                  </div>

                  {/* Role selector dropdown */}
                  <div className="w-full md:w-48">
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm"
                    >
                      <option value="all">All Roles</option>
                      <option value="free">Free Users</option>
                      <option value="paid">Paid Users</option>
                      <option value="admin">Administrators</option>
                    </select>
                  </div>
                </div>

                {/* Users List Table */}
                <div className="overflow-x-auto bg-slate-900/60 border border-white/5 shadow-2xl rounded-2xl glass">
                  {filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-brand-text-muted space-y-2">
                      <UserX className="w-12 h-12 text-slate-600 mx-auto" />
                      <p className="font-bold text-white">No Users Found</p>
                      <p className="text-sm">We couldn't find any users matching your query filter.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                          <th className="p-4 pl-6">Full Name</th>
                          <th className="p-4">Username</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Role Badge</th>
                          <th className="p-4">Registered Date</th>
                          <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {filteredUsers.map((u) => {
                          const isSelf = u.uid === user?.uid;
                          const roleColor = 
                            u.role === "admin" 
                              ? "bg-brand-blue/10 border-brand-blue/20 text-brand-blue" 
                              : u.role === "paid" 
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";

                          return (
                            <tr key={u.uid} className={`hover:bg-slate-900/35 transition-colors duration-150 ${isSelf ? "bg-brand-orange/5" : ""}`}>
                              {/* Full Name */}
                              <td className="p-4 pl-6 font-bold text-white flex items-center gap-2">
                                <span>{u.fullName}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                                    You
                                  </span>
                                )}
                              </td>

                              {/* Username */}
                              <td className="p-4 text-slate-300">@{u.username}</td>

                              {/* Email */}
                              <td className="p-4 text-brand-text-muted">{u.email}</td>

                              {/* Role */}
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${roleColor}`}>
                                  {u.role === "admin" ? <Shield className="w-3.5 h-3.5" /> : u.role === "paid" ? <UserCheck className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                  <span>{u.role.toUpperCase()}</span>
                                </span>
                              </td>

                              {/* Date */}
                              <td className="p-4 text-brand-text-muted">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>

                              {/* Actions */}
                              <td className="p-4 pr-6 text-right space-x-2">
                                {/* Promote/Demote Dropdown */}
                                <select
                                  value={u.role}
                                  disabled={isSelf}
                                  onChange={(e) => handleUpdateRole(u.uid, e.target.value)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-brand-orange text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="free">Free Tier</option>
                                  <option value="paid">Paid Tier</option>
                                  <option value="admin">Administrator</option>
                                </select>

                                {/* Delete User Button */}
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  disabled={isSelf}
                                  className="inline-flex p-2 rounded-lg bg-slate-950 border border-slate-800 text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-slate-800 disabled:hover:text-red-400 disabled:cursor-not-allowed"
                                  title={isSelf ? "Accidental Lockout Protection" : "Delete User"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: RESOURCE CATALOG */}
            {activeTab === "resources" && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Add Catalog Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-900/40 p-4 border border-slate-850 rounded-2xl">
                  
                  {/* Search Bar */}
                  <div className="relative flex-grow max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search resources by title..."
                      value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm"
                    />
                  </div>

                  {/* Filter Selectors */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    {/* Category Selector */}
                    <select
                      value={resourceCategoryFilter}
                      onChange={(e) => setResourceCategoryFilter(e.target.value)}
                      className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm capitalize"
                    >
                      <option value="all">All Categories</option>
                      {resourceCategories.filter(cat => cat !== "all").map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    {/* Access level Selector */}
                    <select
                      value={resourceAccessFilter}
                      onChange={(e) => setResourceAccessFilter(e.target.value)}
                      className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm"
                    >
                      <option value="all">All Access levels</option>
                      <option value="free">Free level</option>
                      <option value="paid">Paid level</option>
                    </select>

                    {/* Add Resource Trigger Button */}
                    <button
                      onClick={() => {
                        setFormError(null);
                        setIsAddResourceOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Resource</span>
                    </button>
                  </div>
                </div>

                {/* Resources Catalog Table */}
                <div className="overflow-x-auto bg-slate-900/60 border border-white/5 shadow-2xl rounded-2xl glass">
                  {filteredResources.length === 0 ? (
                    <div className="p-12 text-center text-brand-text-muted space-y-2">
                      <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                      <p className="font-bold text-white">No Resources Published</p>
                      <p className="text-sm">We couldn't find any resources matching your search selection.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                          <th className="p-4 pl-6">Title</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Access Level</th>
                          <th className="p-4">Published Date</th>
                          <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {filteredResources.map((res) => {
                          const levelColor = 
                            res.accessLevel.toLowerCase() === "free" 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                              : "bg-amber-500/10 border-amber-500/20 text-amber-400";

                          return (
                            <tr key={res.id} className="hover:bg-slate-900/35 transition-colors duration-155">
                              {/* Title */}
                              <td className="p-4 pl-6 font-bold text-white flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-slate-950 border border-slate-850 flex items-center justify-center text-brand-orange">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="line-clamp-1 truncate max-w-xs sm:max-w-md" title={res.title}>
                                  {res.title}
                                </span>
                              </td>

                              {/* Category */}
                              <td className="p-4 text-brand-text-light capitalize">{res.category}</td>

                              {/* Access badge */}
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${levelColor}`}>
                                  {res.accessLevel.toLowerCase() === "free" ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                  <span>{res.accessLevel.toUpperCase()}</span>
                                </span>
                              </td>

                              {/* Created date */}
                              <td className="p-4 text-brand-text-muted">
                                {new Date(res.createdAt).toLocaleDateString()}
                              </td>

                              {/* Edit & Delete Action Row */}
                              <td className="p-4 pr-6 text-right space-x-2">
                                <button
                                  onClick={() => openEditResource(res)}
                                  className="inline-flex p-2 rounded-lg bg-slate-950 border border-slate-800 text-brand-blue hover:text-white hover:bg-brand-blue hover:border-brand-blue transition-all duration-200 cursor-pointer"
                                  title="Edit Resource"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setResourceToDelete(res)}
                                  className="inline-flex p-2 rounded-lg bg-slate-950 border border-slate-800 text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all duration-200 cursor-pointer"
                                  title="Delete Resource"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* ========================================== */}
      {/* 1. DELETE USER CONFIRMATION MODAL */}
      {/* ========================================== */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl glass space-y-6">
            
            <div className="flex gap-4 items-start">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                <UserX className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Delete User Profile</h3>
                <p className="text-sm text-brand-text-muted">
                  Are you sure you want to delete <span className="text-white font-semibold">{userToDelete.fullName}</span> (<code>@{userToDelete.username}</code>)?
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-start gap-3 text-xs text-red-200/80 leading-relaxed">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>Warning: This deletes their database profile and revokes all portal access. The user will be locked out immediately.</span>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 bg-transparent text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-650 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-500/10 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. DELETE RESOURCE CONFIRMATION MODAL */}
      {/* ========================================== */}
      {resourceToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl glass space-y-6">
            
            <div className="flex gap-4 items-start">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Delete Catalog Resource</h3>
                <p className="text-sm text-brand-text-muted">
                  Are you sure you want to remove <span className="text-white font-semibold">"{resourceToDelete.title}"</span>?
                </p>
              </div>
            </div>

            <p className="text-xs text-brand-text-muted leading-relaxed">
              This will remove the publication link from the portal directory catalog. Users will no longer be able to access it.
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setResourceToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 bg-transparent text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteResource}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-650 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-500/10 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. ADD RESOURCE MODAL FORM */}
      {/* ========================================== */}
      {isAddResourceOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl glass space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-brand-orange" />
                <span>Add Resource</span>
              </h3>
              <button 
                onClick={() => setIsAddResourceOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:border-brand-orange text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddResource} className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Resource Title</label>
                <input
                  type="text"
                  placeholder="e.g. CXO Interview Prep Kit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-850 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Description</label>
                <textarea
                  placeholder="Briefly describe what this file or tool covers..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-850 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Assessment"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-850 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm"
                  />
                </div>

                {/* Access Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Access Level</label>
                  <select
                    value={newAccessLevel}
                    onChange={(e) => setNewAccessLevel(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 text-slate-300 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm"
                  >
                    <option value="free">Free level</option>
                    <option value="paid">Paid level</option>
                  </select>
                </div>
              </div>

              {/* Drive Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Google Drive Link</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={newDriveLink}
                  onChange={(e) => setNewDriveLink(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-850 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submittingForm}
                className="w-full mt-4 py-3.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingForm ? (
                  <>
                    <Loader2 className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Adding Publication...</span>
                  </>
                ) : (
                  <span>Publish Resource</span>
                )}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. EDIT RESOURCE MODAL FORM */}
      {/* ========================================== */}
      {resourceToEdit && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl glass space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-brand-blue" />
                <span>Edit Resource</span>
              </h3>
              <button 
                onClick={() => setResourceToEdit(null)}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:border-brand-blue text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditResourceSubmit} className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Resource Title</label>
                <input
                  type="text"
                  placeholder="e.g. CXO Interview Prep Kit"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-850 text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Description</label>
                <textarea
                  placeholder="Briefly describe what this file or tool covers..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-850 text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Assessment"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-850 text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue text-sm"
                  />
                </div>

                {/* Access Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Access Level</label>
                  <select
                    value={editAccessLevel}
                    onChange={(e) => setEditAccessLevel(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 text-slate-300 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue text-sm"
                  >
                    <option value="free">Free level</option>
                    <option value="paid">Paid level</option>
                  </select>
                </div>
              </div>

              {/* Drive Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Google Drive Link</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={editDriveLink}
                  onChange={(e) => setEditDriveLink(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-850 text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submittingForm}
                className="w-full mt-4 py-3.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingForm ? (
                  <>
                    <Loader2 className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
