"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  queryDocuments,
  updateDocument,
  deleteDocument,
  logAdminAction
} from "@/lib/services/firestoreService";
import {
  Users,
  Search,
  Trash2,
  Shield,
  UserCheck,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  XCircle,
  RefreshCcw
} from "lucide-react";

interface FirestoreUser {
  uid: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  suspended?: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Fetch states
  const [usersList, setUsersList] = useState<FirestoreUser[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Search/Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Notifications
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Check access control
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/portal/login");
      } else if (user.role !== "admin") {
        router.replace("/portal/dashboard");
      }
    }
  }, [user, loading, router]);

  const fetchUsers = async () => {
    if (!user || user.role !== "admin") return;
    try {
      setFetchLoading(true);
      const fetched = await queryDocuments("users");
      const formatted = fetched.map((u: any) => ({
        uid: u.uid || u.id || "",
        fullName: u.fullName || "",
        username: u.username || "",
        email: u.email || "",
        role: u.role || "free",
        suspended: u.suspended || false,
        createdAt: u.createdAt || new Date().toISOString()
      }));
      setUsersList(formatted);
    } catch (err) {
      console.error("Error fetching users directory:", err);
      showToast("error", "Failed to retrieve users list from database.");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Modify User Role
  const handleUpdateRole = async (targetUid: string, newRole: string) => {
    if (targetUid === user?.uid || !user) {
      showToast("error", "Safety Lock: You cannot remove your own administrator status.");
      return;
    }

    try {
      await updateDocument("users", targetUid, { role: newRole });
      await logAdminAction(user.uid, user.email || "", "UPDATE_USER_ROLE", `Updated user ${targetUid} role to ${newRole}`);
      showToast("success", `Role updated to ${newRole} successfully.`);
      setUsersList(prev => prev.map(u => u.uid === targetUid ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error("Error updating user role:", err);
      showToast("error", "Failed to change user role.");
    }
  };

  // Toggle user suspension
  const handleToggleSuspension = async (targetUser: FirestoreUser) => {
    if (targetUser.uid === user?.uid || !user) {
      showToast("error", "Safety Lock: You cannot suspend your own administrator account.");
      return;
    }

    const newSuspensionState = !targetUser.suspended;

    try {
      await updateDocument("users", targetUser.uid, { suspended: newSuspensionState });
      await logAdminAction(user.uid, user.email || "", newSuspensionState ? "SUSPEND_USER" : "UNSUSPEND_USER", `${newSuspensionState ? "Suspended" : "Unsuspended"} user profile ${targetUser.uid} (@${targetUser.username})`);
      showToast("success", newSuspensionState ? "User profile suspended." : "User profile unsuspended.");
      setUsersList(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, suspended: newSuspensionState } : u));
    } catch (err) {
      console.error("Error updating user suspension:", err);
      showToast("error", "Failed to modify user suspension status.");
    }
  };

  // Delete User
  const handleDeleteUser = async (targetUser: FirestoreUser) => {
    if (targetUser.uid === user?.uid || !user) {
      showToast("error", "Safety Lock: You cannot delete your own administrator account.");
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user @${targetUser.username}?`)) {
      return;
    }

    try {
      await deleteDocument("users", targetUser.uid);
      await logAdminAction(user.uid, user.email || "", "DELETE_USER", `Permanently deleted user profile ${targetUser.uid} (@${targetUser.username})`);
      showToast("success", "User profile permanently deleted from directory.");
      setUsersList(prev => prev.filter(u => u.uid !== targetUser.uid));
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast("error", "Failed to delete user profile.");
    }
  };

  // Filters
  const filteredUsers = usersList.filter(u => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase().trim());
      
    const matchesRole = roleFilter === "all" || u.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-portal-bg text-portal-text-primary">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 border-4 border-portal-primary border-t-transparent rounded-full animate-spin mx-auto text-portal-primary" />
          <p className="text-portal-text-secondary text-sm tracking-wide">Validating admin permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Back button */}
      <div>
        <Link
          href="/portal/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-portal-text-secondary hover:text-portal-primary transition-colors duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-portal-border/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl flex items-center gap-2">
            <Users className="w-8 h-8 text-portal-primary" />
            <span>User Management</span>
          </h1>
          <p className="text-sm text-portal-text-secondary mt-1">Audit platform subscribers, elevate roles, suspend accounts, and manage permissions.</p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-4 py-2.5 rounded-xl border border-portal-border hover:border-slate-500 bg-slate-900 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Refresh Directory</span>
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

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-900/40 p-4 border border-portal-border/60 rounded-2xl">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-portal-text-secondary">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search users by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-portal-card border border-portal-border/60 text-white placeholder-portal-text-secondary focus:outline-none focus:border-portal-primary focus:ring-1 focus:ring-portal-primary text-sm"
          />
        </div>

        {/* Role Selector dropdown */}
        <div className="w-full md:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-portal-card border border-portal-border/60 text-slate-300 focus:outline-none focus:border-portal-primary text-sm cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="free">Free Tier</option>
            <option value="paid">Paid Tier</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto bg-portal-card border border-portal-border/60 shadow-xl rounded-2xl">
        {fetchLoading ? (
          <div className="p-12 text-center text-portal-text-secondary">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-portal-primary mb-3" />
            <span>Fetching subscribers directory...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-portal-text-secondary space-y-2">
            <XCircle className="w-12 h-12 text-slate-650 mx-auto" />
            <p className="font-bold text-white">No Users Found</p>
            <p className="text-sm">We couldn't find any users matching your query parameters.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-portal-border/60 text-xs font-bold text-portal-text-secondary uppercase tracking-wider bg-slate-950/45">
                <th className="p-4.5 pl-6">Full Name</th>
                <th className="p-4.5">Username</th>
                <th className="p-4.5">Email</th>
                <th className="p-4.5">Role</th>
                <th className="p-4.5">Account Status</th>
                <th className="p-4.5">Registered Date</th>
                <th className="p-4.5 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border/30">
              {filteredUsers.map((u) => {
                const isSelf = u.uid === user?.uid;
                const roleBadgeColor =
                  u.role === "admin"
                    ? "bg-portal-primary/10 border-portal-primary/20 text-portal-primary"
                    : u.role === "paid"
                    ? "bg-portal-secondary/10 border-portal-secondary/20 text-portal-secondary"
                    : "bg-portal-success/10 border-portal-success/20 text-portal-success";

                return (
                  <tr key={u.uid} className={`hover:bg-slate-900/25 transition-colors duration-150 ${isSelf ? "bg-portal-primary/5" : ""}`}>
                    {/* Full Name */}
                    <td className="p-4.5 pl-6 font-bold text-white flex items-center gap-2">
                      <span>{u.fullName}</span>
                      {isSelf && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-portal-primary/20 text-portal-primary border border-portal-primary/30">
                          You
                        </span>
                      )}
                    </td>

                    {/* Username */}
                    <td className="p-4.5 text-slate-300">@{u.username}</td>

                    {/* Email */}
                    <td className="p-4.5 text-portal-text-secondary">{u.email}</td>

                    {/* Role */}
                    <td className="p-4.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${roleBadgeColor}`}>
                        {u.role === "admin" ? (
                          <Shield className="w-3 h-3" />
                        ) : u.role === "paid" ? (
                          <UserCheck className="w-3 h-3" />
                        ) : (
                          <Unlock className="w-3 h-3" />
                        )}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    {/* Suspension status */}
                    <td className="p-4.5">
                      {u.suspended ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wide">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-portal-success/10 border border-portal-success/20 text-portal-success text-[10px] font-bold uppercase tracking-wide">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Created date */}
                    <td className="p-4.5 text-portal-text-secondary">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="p-4.5 pr-6 text-right space-x-2">
                      {/* Change Role selector */}
                      <select
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) => handleUpdateRole(u.uid, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-portal-border/60 text-slate-300 focus:outline-none focus:border-portal-primary text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="free">Free Tier</option>
                        <option value="paid">Paid Tier</option>
                        <option value="admin">Administrator</option>
                      </select>

                      {/* Suspend / Unsuspend */}
                      <button
                        onClick={() => handleToggleSuspension(u)}
                        disabled={isSelf}
                        className={`inline-flex px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          u.suspended
                            ? "bg-portal-success/10 border-portal-success/20 text-portal-success hover:bg-portal-success/20"
                            : "bg-portal-warning/10 border-portal-warning/20 text-portal-warning hover:bg-portal-warning/20"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={u.suspended ? "Unsuspend Account" : "Suspend Account"}
                      >
                        {u.suspended ? "Activate" : "Suspend"}
                      </button>

                      {/* Delete User */}
                      <button
                        onClick={() => handleDeleteUser(u)}
                        disabled={isSelf}
                        className="inline-flex p-2 rounded-lg bg-slate-950 border border-portal-border/60 text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-portal-border/60 disabled:hover:text-red-400 disabled:cursor-not-allowed"
                        title="Delete Account"
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
    </div>
  );
}
