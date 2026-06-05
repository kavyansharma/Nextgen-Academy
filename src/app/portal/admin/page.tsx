"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Award,
  MessageSquare,
  Database,
  BookOpen
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

  // Upgrade admin dashboard metrics states
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [revenueTotal, setRevenueTotal] = useState(0);
  const [subscriptionsCount, setSubscriptionsCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [resourcesCount, setResourcesCount] = useState(0);
  const [certificatesCount, setCertificatesCount] = useState(0);
  const [ticketsCount, setTicketsCount] = useState(0);
  const [logsCount, setLogsCount] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

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

  // Helper for notification
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setFetchLoading(true);
      const [
        fetchedUsers, 
        fetchedResources,
        fetchedPayments,
        fetchedSubscriptions,
        fetchedCourses,
        fetchedCertificates,
        fetchedTickets,
        fetchedLogs,
        fetchedActivity
      ] = await Promise.all([
        queryDocuments("users"),
        queryDocuments("resources"),
        queryDocuments("payments"),
        queryDocuments("subscriptions"),
        queryDocuments("courses"),
        queryDocuments("certificates"),
        queryDocuments("support_tickets"),
        queryDocuments("audit_logs"),
        queryDocuments("user_activity")
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

      // Populate metrics
      setTotalUsersCount(formattedUsers.length);
      setActiveUsersCount(fetchedActivity.length);
      const totalRev = fetchedPayments.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
      setRevenueTotal(totalRev);
      setSubscriptionsCount(fetchedSubscriptions.filter((s: any) => s.status === "active").length);
      setCoursesCount(fetchedCourses.length);
      setResourcesCount(formattedResources.length);
      setCertificatesCount(fetchedCertificates.length);
      setTicketsCount(fetchedTickets.length);
      setLogsCount(fetchedLogs.length);

      // Sort and slice recent logs
      const sortedLogs = [...fetchedLogs].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
      setRecentLogs(sortedLogs);
    } catch (err) {
      console.error("Admin Fetch Error:", err);
      showNotification("error", "Failed to retrieve directory data from Firestore.");
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      if (user && user.role === "admin") {
        fetchData();
      }
    };
    run();
  }, [user, fetchData]);

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
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-portal-primary" />
          <p className="text-portal-text-secondary text-sm tracking-wide">Authorizing admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[85vh] py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 overflow-hidden text-portal-text-primary">
      <div className="max-w-7xl mx-auto z-10 relative space-y-8 animate-fade-in">

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-portal-border pb-6">
          <div className="space-y-2">
            <Link
              href="/portal/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-portal-text-secondary hover:text-portal-primary transition-colors duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-extrabold text-portal-text-primary tracking-tight sm:text-4xl flex items-center gap-3">
              <Settings className="w-8 h-8 text-portal-primary" />
              <span>Admin Console</span>
            </h1>
            <p className="text-sm text-portal-text-secondary">Manage system directories, user roles, catalog publications, and permissions.</p>
          </div>

          <div className="flex items-center gap-2 bg-white border border-portal-border rounded-full px-4 py-2 self-start md:self-center shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs text-portal-text-secondary font-medium">Console Online</span>
          </div>
        </div>

        {/* Global Notifications */}
        {notification && (
          <div className={`flex gap-3 p-4 rounded-xl text-sm border z-50 animate-fade-in ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-portal-border">
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
                    ? "border-portal-primary text-portal-primary bg-blue-50/40"
                    : "border-transparent text-portal-text-secondary hover:text-portal-text-primary hover:border-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* LOADING SKELETON */}
        {fetchLoading ? (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-portal-primary" />
            <p className="text-portal-text-secondary text-sm">Syncing with Firestore database...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fade-in">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                  {[
                    { label: "Total Users", value: totalUsersCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                    { label: "Active Users", value: activeUsersCount, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                    { label: "Total Revenue", value: `₹${revenueTotal}`, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                    { label: "Active Premium", value: subscriptionsCount, icon: Award, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100" },
                    { label: "Courses", value: coursesCount, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
                    { label: "Resources", value: resourcesCount, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
                    { label: "Certificates", value: certificatesCount, icon: Award, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
                    { label: "Support Tickets", value: ticketsCount, icon: MessageSquare, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100" },
                  ].map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.label} className="p-6 rounded-2xl bg-white border border-portal-border shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-portal-text-secondary uppercase tracking-wider">{card.label}</p>
                            <p className="text-3xl font-extrabold text-portal-text-primary">{card.value}</p>
                          </div>
                          <div className={`p-2.5 rounded-xl ${card.bg} border ${card.border} ${card.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Administrative Consoles Grid */}
                <div className="space-y-4">
                  <h3 className="font-bold text-portal-text-primary text-lg tracking-tight">Administrative Consoles</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {[
                      { href: "/portal/admin/payments", label: "Payments Ledger", desc: "Refunds & ledger audit", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", hover: "hover:border-blue-200" },
                      { href: "/portal/admin/subscriptions", label: "Subscription Desk", desc: "Adjust expiry & cancel", icon: Award, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100", hover: "hover:border-cyan-200" },
                      { href: "/portal/admin/analytics", label: "Analytics Panel", desc: "Real-time KPI reports", icon: Activity, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", hover: "hover:border-purple-200" },
                      { href: "/portal/admin/resources", label: "Resource Manager", desc: "Publish & tag uploads", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", hover: "hover:border-emerald-200" },
                      { href: "/portal/admin/support", label: "Support Desk", desc: "Ticketing & messaging", icon: MessageSquare, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100", hover: "hover:border-sky-200" },
                      { href: "/portal/admin/community", label: "Community Moderator", desc: "Review reported posts", icon: Users, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", hover: "hover:border-rose-200" },
                      { href: "/portal/admin/settings", label: "System Settings", desc: "Platform flags & settings", icon: Settings, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", hover: "hover:border-amber-200" },
                      { href: "/portal/admin/backups", label: "Backup Center", desc: "CSV Database exports", icon: Database, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100", hover: "hover:border-teal-200" },
                      { href: "/portal/admin/communications", label: "Communications", desc: "Role targeted broadcasts", icon: Mail, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", hover: "hover:border-indigo-200" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`p-5 rounded-2xl bg-white border border-portal-border shadow-sm flex items-center gap-4 ${item.hover} hover:shadow-md transition-all duration-300 group`}
                        >
                          <div className={`p-3 rounded-xl ${item.bg} border ${item.border} ${item.color} group-hover:scale-105 transition-transform`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-portal-text-primary text-sm">{item.label}</h4>
                            <p className="text-xs text-portal-text-secondary mt-0.5">{item.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Audit Logs */}
                <div className="p-6 rounded-2xl bg-white border border-portal-border shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-portal-border pb-3">
                    <h3 className="font-bold text-portal-text-primary text-lg tracking-tight flex items-center gap-2">
                      <Shield className="w-5 h-5 text-portal-primary" />
                      <span>Recent System Activity Trail</span>
                    </h3>
                    <span className="text-xs text-portal-text-secondary font-semibold">Total Logs: {logsCount}</span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-2">
                    {recentLogs.length === 0 ? (
                      <p className="p-8 text-xs text-portal-text-secondary italic text-center">No system operations recorded in database.</p>
                    ) : (
                      recentLogs.map((log: any) => (
                        <div key={log.id} className="py-3 flex justify-between items-start gap-4 text-xs">
                          <div>
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-blue-50 border border-blue-100 text-blue-700">
                              {log.action}
                            </span>
                            <p className="text-portal-text-primary mt-1">{log.details}</p>
                            <span className="text-[10px] text-portal-text-secondary font-mono">@{log.adminEmail || "SYSTEM"}</span>
                          </div>
                          <span className="text-[10px] text-portal-text-secondary whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: USER MANAGEMENT */}
            {activeTab === "users" && (
              <div className="space-y-6 animate-fade-in">
                {/* Search / Filter Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 border border-portal-border rounded-2xl shadow-sm">
                  <div className="relative flex-grow max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search users by name, email, or username..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary placeholder-slate-400 focus:outline-none focus:border-portal-primary focus:ring-1 focus:ring-portal-primary/20 text-sm"
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary focus:ring-1 focus:ring-portal-primary/20 text-sm cursor-pointer"
                    >
                      <option value="all">All Roles</option>
                      <option value="free">Free Users</option>
                      <option value="paid">Paid Users</option>
                      <option value="admin">Administrators</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto bg-white border border-portal-border shadow-sm rounded-2xl">
                  {filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-portal-text-secondary space-y-2">
                      <UserX className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="font-bold text-portal-text-primary">No Users Found</p>
                      <p className="text-sm">We couldn&apos;t find any users matching your query filter.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-portal-border text-xs font-bold text-portal-text-secondary uppercase tracking-wider bg-slate-50">
                          <th className="p-4 pl-6">Full Name</th>
                          <th className="p-4">Username</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Role Badge</th>
                          <th className="p-4">Registered Date</th>
                          <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((u) => {
                          const isSelf = u.uid === user?.uid;
                          const roleColor =
                            u.role === "admin"
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : u.role === "paid"
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : "bg-emerald-50 border-emerald-200 text-emerald-700";

                          return (
                            <tr key={u.uid} className={`hover:bg-slate-50/70 transition-colors duration-150 ${isSelf ? "bg-blue-50/30" : ""}`}>
                              <td className="p-4 pl-6 font-bold text-portal-text-primary flex items-center gap-2">
                                <span>{u.fullName}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                    You
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-portal-text-secondary">@{u.username}</td>
                              <td className="p-4 text-portal-text-secondary">{u.email}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${roleColor}`}>
                                  {u.role === "admin" ? <Shield className="w-3.5 h-3.5" /> : u.role === "paid" ? <UserCheck className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                  <span>{u.role.toUpperCase()}</span>
                                </span>
                              </td>
                              <td className="p-4 text-portal-text-secondary">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-4 pr-6 text-right space-x-2">
                                <select
                                  value={u.role}
                                  disabled={isSelf}
                                  onChange={(e) => handleUpdateRole(u.uid, e.target.value)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="free">Free Tier</option>
                                  <option value="paid">Paid Tier</option>
                                  <option value="admin">Administrator</option>
                                </select>
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  disabled={isSelf}
                                  className="inline-flex p-2 rounded-lg bg-white border border-portal-border text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 border border-portal-border rounded-2xl shadow-sm">
                  <div className="relative flex-grow max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search resources by title..."
                      value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary placeholder-slate-400 focus:outline-none focus:border-portal-primary focus:ring-1 focus:ring-portal-primary/20 text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    <select
                      value={resourceCategoryFilter}
                      onChange={(e) => setResourceCategoryFilter(e.target.value)}
                      className="px-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary text-sm capitalize cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {resourceCategories.filter(cat => cat !== "all").map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <select
                      value={resourceAccessFilter}
                      onChange={(e) => setResourceAccessFilter(e.target.value)}
                      className="px-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary text-sm cursor-pointer"
                    >
                      <option value="all">All Access Levels</option>
                      <option value="free">Free Level</option>
                      <option value="paid">Paid Level</option>
                    </select>
                    <button
                      onClick={() => { setFormError(null); setIsAddResourceOpen(true); }}
                      className="px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-white font-semibold transition-all duration-300 hover:scale-[1.02] shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Resource</span>
                    </button>
                  </div>
                </div>

                {/* Resources Table */}
                <div className="overflow-x-auto bg-white border border-portal-border shadow-sm rounded-2xl">
                  {filteredResources.length === 0 ? (
                    <div className="p-12 text-center text-portal-text-secondary space-y-2">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="font-bold text-portal-text-primary">No Resources Published</p>
                      <p className="text-sm">We couldn&apos;t find any resources matching your search selection.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-portal-border text-xs font-bold text-portal-text-secondary uppercase tracking-wider bg-slate-50">
                          <th className="p-4 pl-6">Title</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Access Level</th>
                          <th className="p-4">Published Date</th>
                          <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredResources.map((res) => {
                          const levelColor =
                            res.accessLevel.toLowerCase() === "free"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-amber-50 border-amber-200 text-amber-700";
                          return (
                            <tr key={res.id} className="hover:bg-slate-50/70 transition-colors duration-150">
                              <td className="p-4 pl-6 font-bold text-portal-text-primary">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-portal-primary">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <span className="line-clamp-1 truncate max-w-xs sm:max-w-md" title={res.title}>{res.title}</span>
                                </div>
                              </td>
                              <td className="p-4 text-portal-text-secondary capitalize">{res.category}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${levelColor}`}>
                                  {res.accessLevel.toLowerCase() === "free" ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                  <span>{res.accessLevel.toUpperCase()}</span>
                                </span>
                              </td>
                              <td className="p-4 text-portal-text-secondary">
                                {new Date(res.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-4 pr-6 text-right space-x-2">
                                <button
                                  onClick={() => openEditResource(res)}
                                  className="inline-flex p-2 rounded-lg bg-white border border-portal-border text-portal-secondary hover:text-white hover:bg-portal-secondary hover:border-portal-secondary transition-all duration-200 cursor-pointer"
                                  title="Edit Resource"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setResourceToDelete(res)}
                                  className="inline-flex p-2 rounded-lg bg-white border border-portal-border text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all duration-200 cursor-pointer"
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

      {/* DELETE USER MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-portal-border rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex gap-4 items-start">
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600">
                <UserX className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-portal-text-primary">Delete User Profile</h3>
                <p className="text-sm text-portal-text-secondary">
                  Are you sure you want to delete <span className="text-portal-text-primary font-semibold">{userToDelete.fullName}</span> (<code>@{userToDelete.username}</code>)?
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-700 leading-relaxed">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>Warning: This deletes their database profile and revokes all portal access. The user will be locked out immediately.</span>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setUserToDelete(null)} className="px-5 py-2.5 rounded-xl border border-portal-border hover:bg-slate-50 text-sm font-semibold text-portal-text-secondary hover:text-portal-text-primary transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleDeleteUser} className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE RESOURCE MODAL */}
      {resourceToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-portal-border rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex gap-4 items-start">
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-portal-text-primary">Delete Catalog Resource</h3>
                <p className="text-sm text-portal-text-secondary">Are you sure you want to remove <span className="text-portal-text-primary font-semibold">&quot;{resourceToDelete.title}&quot;</span>?</p>
              </div>
            </div>
            <p className="text-xs text-portal-text-secondary leading-relaxed">This will remove the publication link from the portal directory catalog. Users will no longer be able to access it.</p>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setResourceToDelete(null)} className="px-5 py-2.5 rounded-xl border border-portal-border hover:bg-slate-50 text-sm font-semibold text-portal-text-secondary hover:text-portal-text-primary transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleDeleteResource} className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD RESOURCE MODAL */}
      {isAddResourceOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-portal-border rounded-3xl p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-portal-border pb-4">
              <h3 className="text-2xl font-bold text-portal-text-primary flex items-center gap-2">
                <Plus className="w-6 h-6 text-portal-primary" />
                <span>Add Resource</span>
              </h3>
              <button onClick={() => setIsAddResourceOpen(false)} className="p-1.5 rounded-lg border border-portal-border hover:bg-slate-50 text-portal-text-secondary hover:text-portal-text-primary transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {formError && (
              <div className="flex gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            <form onSubmit={handleAddResource} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-portal-text-secondary uppercase tracking-wide">Resource Title</label>
                <input type="text" placeholder="e.g. CXO Interview Prep Kit" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary placeholder-slate-400 focus:outline-none focus:border-portal-primary focus:ring-1 focus:ring-portal-primary/20 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-portal-text-secondary uppercase tracking-wide">Description</label>
                <textarea placeholder="Briefly describe what this file or tool covers..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary placeholder-slate-400 focus:outline-none focus:border-portal-primary focus:ring-1 focus:ring-portal-primary/20 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-portal-text-secondary uppercase tracking-wide">Category</label>
                  <input type="text" placeholder="e.g. Assessment" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary placeholder-slate-400 focus:outline-none focus:border-portal-primary focus:ring-1 focus:ring-portal-primary/20 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-portal-text-secondary uppercase tracking-wide">Access Level</label>
                  <select value={newAccessLevel} onChange={(e) => setNewAccessLevel(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary text-sm cursor-pointer">
                    <option value="free">Free Level</option>
                    <option value="paid">Paid Level</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-portal-text-secondary uppercase tracking-wide">Google Drive Link</label>
                <input type="text" placeholder="https://drive.google.com/..." value={newDriveLink} onChange={(e) => setNewDriveLink(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary placeholder-slate-400 focus:outline-none focus:border-portal-primary focus:ring-1 focus:ring-portal-primary/20 text-sm" />
              </div>
              <button type="submit" disabled={submittingForm} className="w-full mt-4 py-3.5 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-white font-semibold transition-all duration-300 hover:scale-[1.02] shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {submittingForm ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>Adding Publication...</span></>) : (<span>Publish Resource</span>)}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RESOURCE MODAL */}
      {resourceToEdit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-portal-border rounded-3xl p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-portal-border pb-4">
              <h3 className="text-2xl font-bold text-portal-text-primary flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-portal-secondary" />
                <span>Edit Resource</span>
              </h3>
              <button onClick={() => setResourceToEdit(null)} className="p-1.5 rounded-lg border border-portal-border hover:bg-slate-50 text-portal-text-secondary hover:text-portal-text-primary transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {formError && (
              <div className="flex gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            <form onSubmit={handleEditResourceSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-portal-text-secondary uppercase tracking-wide">Resource Title</label>
                <input type="text" placeholder="e.g. CXO Interview Prep Kit" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary placeholder-slate-400 focus:outline-none focus:border-portal-secondary focus:ring-1 focus:ring-portal-secondary/20 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-portal-text-secondary uppercase tracking-wide">Description</label>
                <textarea placeholder="Briefly describe what this file or tool covers..." value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary placeholder-slate-400 focus:outline-none focus:border-portal-secondary focus:ring-1 focus:ring-portal-secondary/20 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-portal-text-secondary uppercase tracking-wide">Category</label>
                  <input type="text" placeholder="e.g. Assessment" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary placeholder-slate-400 focus:outline-none focus:border-portal-secondary focus:ring-1 focus:ring-portal-secondary/20 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-portal-text-secondary uppercase tracking-wide">Access Level</label>
                  <select value={editAccessLevel} onChange={(e) => setEditAccessLevel(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-secondary text-sm cursor-pointer">
                    <option value="free">Free Level</option>
                    <option value="paid">Paid Level</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-portal-text-secondary uppercase tracking-wide">Google Drive Link</label>
                <input type="text" placeholder="https://drive.google.com/..." value={editDriveLink} onChange={(e) => setEditDriveLink(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary placeholder-slate-400 focus:outline-none focus:border-portal-secondary focus:ring-1 focus:ring-portal-secondary/20 text-sm" />
              </div>
              <button type="submit" disabled={submittingForm} className="w-full mt-4 py-3.5 rounded-xl bg-portal-secondary hover:bg-portal-secondary/90 text-white font-semibold transition-all duration-300 hover:scale-[1.02] shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {submittingForm ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>Saving Changes...</span></>) : (<span>Save Changes</span>)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
