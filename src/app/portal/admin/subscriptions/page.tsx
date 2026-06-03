"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  queryDocuments,
  updateDocument,
  logAdminAction,
  addDocument,
  setDocument
} from "@/lib/services/firestoreService";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Award,
  Search,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  UserCheck,
  Ban,
  Clock
} from "lucide-react";

interface SubscriptionDoc {
  id: string; // matches userId
  userId: string;
  plan: string;
  status: "active" | "cancelled" | "expired";
  startDate: string;
  expiryDate: string;
  paymentId: string;
}

interface UserDoc {
  id: string;
  name?: string;
  email: string;
  role: string;
}

export default function AdminSubscriptionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Lists
  const [subscriptions, setSubscriptions] = useState<SubscriptionDoc[]>([]);
  const [users, setUsers] = useState<Record<string, UserDoc>>({});
  const [loadingData, setLoadingData] = useState(true);

  // Edit / Action States
  const [subToEdit, setSubToEdit] = useState<SubscriptionDoc | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Plans Config
  interface Plan {
    id: string;
    name: string;
    price: number;
    billingPeriod: string;
    features: string[];
    active: boolean;
  }
  const [activeTab, setActiveTab] = useState<"subscriptions" | "plans">("subscriptions");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);
  const [editedFeatures, setEditedFeatures] = useState("");

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

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    try {
      setLoadingData(true);
      // Fetch subscriptions and users
      const subsList = (await queryDocuments("subscriptions")) as SubscriptionDoc[];
      const sortedSubs = subsList.sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      setSubscriptions(sortedSubs);

      const usersList = (await queryDocuments("users")) as UserDoc[];
      const usersMap: Record<string, UserDoc> = {};
      usersList.forEach((u) => {
        usersMap[u.id] = u;
      });
      setUsers(usersMap);

      // Load Plans or Seed them
      const plansList = (await queryDocuments("plans")) as Plan[];
      if (plansList.length === 0) {
        const defaultPlans: Plan[] = [
          {
            id: "free",
            name: "Free Tier",
            price: 0,
            billingPeriod: "always",
            features: ["Access to free courses", "Access to public community forum", "Basic student dashboard"],
            active: true
          },
          {
            id: "premium_monthly",
            name: "Premium Monthly",
            price: 999,
            billingPeriod: "month",
            features: ["Access to all courses", "Access to premium resources", "Verified certificates", "Priority support"],
            active: true
          },
          {
            id: "premium_yearly",
            name: "Premium Yearly",
            price: 7999,
            billingPeriod: "year",
            features: ["Access to all courses", "Access to premium resources", "Verified certificates", "Priority support", "Exclusive community badges"],
            active: true
          },
          {
            id: "corporate",
            name: "Corporate Plan",
            price: 0,
            billingPeriod: "custom",
            features: ["Bulk seat licenses", "Dedicated account manager", "Custom branding portals", "Enterprise analytics reports", "SLA-guaranteed support"],
            active: true
          }
        ];
        for (const p of defaultPlans) {
          await setDocument("plans", p.id, p);
        }
        setPlans(defaultPlans);
      } else {
        setPlans(plansList);
      }
    } catch (err) {
      console.error("Error loading subscriptions data:", err);
      showToast("error", "Failed to retrieve subscription profiles.");
    } finally {
      setLoadingData(false);
    }
  }, [user, showToast]);

  const handleOpenEditPlan = (plan: Plan) => {
    setPlanToEdit(plan);
    setEditedFeatures(plan.features.join("\n"));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planToEdit || !user) return;

    setSubmittingAction(true);
    try {
      const updatedFeatures = editedFeatures
        .split("\n")
        .map(f => f.trim())
        .filter(Boolean);

      const updatedPlan = {
        ...planToEdit,
        features: updatedFeatures,
        updatedAt: new Date().toISOString()
      };

      await setDocument("plans", planToEdit.id, updatedPlan);

      // Log Admin Action
      await logAdminAction(
        user.uid,
        user.email || "admin@nextgen.com",
        "EDIT_MEMBERSHIP_PLAN",
        `Updated details for plan: ${planToEdit.name} (price: ${planToEdit.price})`
      );

      showToast("success", `Plan "${planToEdit.name}" updated successfully!`);
      setPlanToEdit(null);
      
      // Reload plans
      const plansList = (await queryDocuments("plans")) as Plan[];
      setPlans(plansList);
    } catch (err: any) {
      console.error("Save plan error:", err);
      showToast("error", err.message || "Failed to update membership plan.");
    } finally {
      setSubmittingAction(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      loadData();
    };
    run();
  }, [loadData]);

  if (!user || user.role !== "admin") return null;

  // Cancel Subscription
  const handleCancelSubscription = async (sub: SubscriptionDoc) => {
    if (!user) return;
    const customer = users[sub.userId];
    if (
      !confirm(
        `Are you sure you want to cancel subscription for user ${
          customer?.email || sub.userId
        }?\nThis will downgrade their role to 'free' instantly.`
      )
    ) {
      return;
    }

    setSubmittingAction(true);
    try {
      // 1. Update Subscription Status in Firestore
      await updateDocument("subscriptions", sub.id, {
        status: "cancelled",
      });

      // 2. Downgrade user role to 'free'
      const userRef = doc(db, "users", sub.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          role: "free",
          updatedAt: new Date().toISOString(),
        });
      }

      // 3. Log Admin Action
      await logAdminAction(
        user.uid,
        user.email || "admin@nextgen.com",
        "CANCEL_SUBSCRIPTION",
        `Cancelled subscription: ${sub.id} for User: ${sub.userId}. Role set to free.`
      );

      // 4. Send Notification
      await addDocument("notifications", {
        userId: sub.userId,
        title: "Subscription Cancelled",
        message: "Your premium subscription has been cancelled by an administrator.",
        type: "subscription",
        read: false,
        createdAt: new Date().toISOString(),
      });

      showToast("success", "Subscription cancelled successfully!");
      loadData();
    } catch (err: any) {
      console.error("Cancel subscription error:", err);
      showToast("error", err.message || "Failed to cancel subscription.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Open Edit Expiration Modal
  const handleOpenEditExpiry = (sub: SubscriptionDoc) => {
    setSubToEdit(sub);
    // Format existing expiryDate (ISO) to YYYY-MM-DD
    try {
      const dateStr = sub.expiryDate.split("T")[0];
      setNewExpiryDate(dateStr);
    } catch {
      setNewExpiryDate("");
    }
  };

  // Save Expiration Edit
  const handleSaveExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subToEdit || !newExpiryDate || !user) return;

    setSubmittingAction(true);
    try {
      const expiryISO = new Date(newExpiryDate).toISOString();
      const nowISO = new Date().toISOString();
      const newStatus = expiryISO > nowISO ? "active" : "expired";

      // 1. Update subscription document
      await updateDocument("subscriptions", subToEdit.id, {
        expiryDate: expiryISO,
        status: newStatus,
      });

      // 2. Synchronize user role
      const userRef = doc(db, "users", subToEdit.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          role: newStatus === "active" ? "paid" : "free",
          updatedAt: nowISO,
        });
      }

      // 3. Log Audit Action
      await logAdminAction(
        user.uid,
        user.email || "admin@nextgen.com",
        "EDIT_SUBSCRIPTION_EXPIRY",
        `Updated subscription expiry to ${newExpiryDate} (status: ${newStatus}) for User: ${subToEdit.userId}`
      );

      // 4. Send Notification
      await addDocument("notifications", {
        userId: subToEdit.userId,
        title: "Subscription Updated",
        message: `Your membership expiration date has been updated to ${new Date(
          newExpiryDate
        ).toLocaleDateString()}. Status: ${newStatus.toUpperCase()}`,
        type: "subscription",
        read: false,
        createdAt: nowISO,
      });

      showToast("success", "Expiration date updated successfully!");
      setSubToEdit(null);
      loadData();
    } catch (err: any) {
      console.error("Update expiry error:", err);
      showToast("error", err.message || "Failed to update expiration date.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Search Filter
  const filteredSubs = subscriptions.filter((sub) => {
    const customer = users[sub.userId];
    const customerEmail = customer?.email?.toLowerCase() || "";
    const customerName = customer?.name?.toLowerCase() || "";
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      customerEmail.includes(query) ||
      customerName.includes(query) ||
      sub.userId.toLowerCase().includes(query) ||
      sub.paymentId.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const cancelledCount = subscriptions.filter((s) => s.status === "cancelled").length;
  const expiredCount = subscriptions.filter((s) => s.status === "expired").length;

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Back Link */}
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
      <div className="border-b border-portal-border/60 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl flex items-center gap-2">
          <Award className="w-8 h-8 text-portal-primary" />
          <span>Subscription & Membership Settings</span>
        </h1>
        <p className="text-sm text-portal-text-secondary mt-1">
          Monitor customer memberships, modify validation periods, terminate active licenses, and customize tier pricing plans.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex gap-3 p-4 rounded-xl text-sm border shadow-lg animate-fade-in ${
            toast.type === "success"
              ? "bg-portal-success/10 border-portal-success/20 text-portal-success"
              : "bg-red-500/10 border-red-500/20 text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-portal-border/40">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "subscriptions"
              ? "border-portal-primary text-white"
              : "border-transparent text-portal-text-secondary hover:text-white"
          }`}
        >
          Subscriptions Desk
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "plans"
              ? "border-portal-primary text-white"
              : "border-transparent text-portal-text-secondary hover:text-white"
          }`}
        >
          Membership Plans
        </button>
      </div>

      {activeTab === "subscriptions" ? (
        <>
          {/* Stats Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Registered */}
            <div className="bg-portal-card border border-portal-border/60 p-5 rounded-2xl flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-xs text-portal-text-secondary font-bold uppercase tracking-wider">Total Subscriptions</span>
                <h3 className="text-2xl font-black text-white">{subscriptions.length}</h3>
                <p className="text-[10px] text-portal-text-secondary font-semibold">Registered active or inactive</p>
              </div>
              <div className="w-12 h-12 bg-slate-900 text-portal-secondary rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>

            {/* Active Members */}
            <div className="bg-portal-card border border-portal-border/60 p-5 rounded-2xl flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-xs text-portal-text-secondary font-bold uppercase tracking-wider">Active Premium</span>
                <h3 className="text-2xl font-black text-white">{activeCount}</h3>
                <p className="text-[10px] text-portal-success font-semibold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Full portal access</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-portal-success/10 text-portal-success rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Cancelled */}
            <div className="bg-portal-card border border-portal-border/60 p-5 rounded-2xl flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-xs text-portal-text-secondary font-bold uppercase tracking-wider">Cancelled Licenses</span>
                <h3 className="text-2xl font-black text-white">{cancelledCount}</h3>
                <p className="text-[10px] text-portal-warning font-semibold">Refunded or terminated</p>
              </div>
              <div className="w-12 h-12 bg-slate-900 text-portal-warning rounded-xl flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
            </div>

            {/* Expired */}
            <div className="bg-portal-card border border-portal-border/60 p-5 rounded-2xl flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-xs text-portal-text-secondary font-bold uppercase tracking-wider">Expired accounts</span>
                <h3 className="text-2xl font-black text-white">{expiredCount}</h3>
                <p className="text-[10px] text-red-400 font-semibold">Passed validation period</p>
              </div>
              <div className="w-12 h-12 bg-slate-900 text-red-400 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-900/40 p-4 border border-portal-border/60 rounded-2xl">
            <div className="relative flex-grow max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-portal-text-secondary">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by User Name, Email, UID, Payment ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-portal-card border border-portal-border/60 text-white placeholder-portal-text-secondary focus:outline-none focus:border-portal-primary focus:ring-1 focus:ring-portal-primary text-sm"
              />
            </div>

            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-portal-card border border-portal-border/60 text-slate-300 focus:outline-none focus:border-portal-primary text-sm cursor-pointer"
              >
                <option value="all">All Subscriptions</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="overflow-x-auto bg-portal-card border border-portal-border/60 shadow-xl rounded-2xl">
            {loadingData ? (
              <div className="p-12 text-center text-portal-text-secondary">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-portal-primary mb-3" />
                <span>Loading subscription records...</span>
              </div>
            ) : filteredSubs.length === 0 ? (
              <div className="p-12 text-center text-portal-text-secondary space-y-2">
                <Award className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="font-bold text-white">No Subscriptions Found</p>
                <p className="text-sm">We couldn&apos;t find any subscription profiles matching your filter.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-portal-border/60 text-xs font-bold text-portal-text-secondary uppercase tracking-wider bg-slate-950/45">
                    <th className="p-4.5 pl-6">Student Profile</th>
                    <th className="p-4.5">Tier Plan</th>
                    <th className="p-4.5">Start Date</th>
                    <th className="p-4.5">Expiry Date</th>
                    <th className="p-4.5">Status</th>
                    <th className="p-4.5 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-portal-border/30">
                  {filteredSubs.map((sub) => {
                    const customer = users[sub.userId];
                    const badgeColor =
                      sub.status === "active"
                        ? "bg-portal-success/10 border-portal-success/20 text-portal-success"
                        : sub.status === "cancelled"
                        ? "bg-portal-warning/10 border-portal-warning/20 text-portal-warning"
                        : "bg-red-500/10 border-red-500/20 text-red-400";

                    return (
                      <tr key={sub.id} className="hover:bg-slate-900/25 transition-colors duration-150">
                        {/* Customer */}
                        <td className="p-4.5 pl-6">
                          <div className="font-bold text-slate-200">{customer?.name || "Anonymous Member"}</div>
                          <p className="text-xs text-portal-text-secondary font-medium">{customer?.email || `UID: ${sub.userId}`}</p>
                        </td>

                        {/* Plan */}
                        <td className="p-4.5 font-bold text-white capitalize text-xs">
                          {sub.plan}
                        </td>

                        {/* Start Date */}
                        <td className="p-4.5 text-slate-300 text-xs">
                          {new Date(sub.startDate).toLocaleDateString()}
                        </td>

                        {/* Expiry Date */}
                        <td className="p-4.5 text-slate-300 text-xs font-semibold">
                          {new Date(sub.expiryDate).toLocaleDateString()}
                        </td>

                        {/* Status */}
                        <td className="p-4.5">
                          <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                            {sub.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4.5 pr-6 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditExpiry(sub)}
                            className="inline-flex p-2 rounded-lg bg-slate-900 border border-portal-border text-portal-secondary hover:text-white transition-all cursor-pointer"
                            title="Edit Expiry"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                          {sub.status === "active" && (
                            <button
                              onClick={() => handleCancelSubscription(sub)}
                              disabled={submittingAction}
                              className="inline-flex p-2 rounded-lg bg-slate-900 border border-portal-border text-red-400 hover:text-white hover:bg-red-500/15 transition-all cursor-pointer disabled:opacity-50"
                              title="Cancel subscription"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Plans list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => {
              const isCorporate = p.id === "corporate";
              const isFree = p.id === "free";
              return (
                <div
                  key={p.id}
                  className="bg-portal-card border border-portal-border/60 rounded-3xl p-6 flex flex-col justify-between hover:border-portal-primary/30 transition-all duration-300 relative overflow-hidden group shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-black text-white">{p.name}</h4>
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                          p.active
                            ? "bg-portal-success/10 border-portal-success/20 text-portal-success"
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}
                      >
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="py-3 border-y border-portal-border/30">
                      <span className="text-2xl font-black text-white">
                        {isCorporate ? "Custom" : `₹${p.price}`}
                      </span>
                      {!isFree && !isCorporate && (
                        <span className="text-xs text-portal-text-secondary capitalize"> / {p.billingPeriod}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-white uppercase tracking-wider">Features</p>
                      <ul className="space-y-1.5">
                        {p.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs text-portal-text-secondary leading-normal">
                            <span className="text-portal-primary font-bold">•</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-portal-border/40">
                    <button
                      onClick={() => handleOpenEditPlan(p)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 border border-portal-border hover:border-portal-primary text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Edit Plan Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Expiration Modal */}
      {subToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => {
              if (!submittingAction) setSubToEdit(null);
            }}
          ></div>

          <form
            onSubmit={handleSaveExpiry}
            className="relative w-full max-w-md bg-portal-card border border-portal-border rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-slate-100 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-portal-border/60 pb-3">
              <h3 className="text-lg font-bold text-white font-black">Edit Subscription validation</h3>
              <button
                type="button"
                onClick={() => setSubToEdit(null)}
                className="p-1.5 rounded-lg text-portal-text-secondary hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-950/40 border border-portal-border/20 rounded-2xl text-xs space-y-1">
                <p className="text-portal-text-secondary font-bold uppercase tracking-wider text-[10px]">User Account</p>
                <p className="text-white font-bold">{users[subToEdit.userId]?.name || "Anonymous"}</p>
                <p className="text-portal-text-secondary">{users[subToEdit.userId]?.email || `UID: ${subToEdit.userId}`}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">New Expiration Date</label>
                <input
                  type="date"
                  required
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm font-semibold"
                />
                <p className="text-[10px] text-portal-text-secondary mt-1.5 leading-relaxed">
                  Extending this date beyond today will automatically reactivate the user&apos;s role to &apos;paid&apos; if it is currently expired or free.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-portal-border/60">
              <button
                type="button"
                onClick={() => setSubToEdit(null)}
                className="flex-grow flex-1 py-3 rounded-xl border border-portal-border hover:bg-slate-900 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingAction}
                className="flex-grow flex-1 py-3 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {submittingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Expiration</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Plan Modal */}
      {planToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => {
              if (!submittingAction) setPlanToEdit(null);
            }}
          ></div>

          <form
            onSubmit={handleSavePlan}
            className="relative w-full max-w-lg bg-portal-card border border-portal-border rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-slate-100 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-portal-border/60 pb-3">
              <h3 className="text-lg font-bold text-white font-black">Configure Tier: {planToEdit.name}</h3>
              <button
                type="button"
                onClick={() => setPlanToEdit(null)}
                className="p-1.5 rounded-lg text-portal-text-secondary hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={planToEdit.name}
                    onChange={(e) => setPlanToEdit({ ...planToEdit, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    disabled={planToEdit.id === "free" || planToEdit.id === "corporate"}
                    value={planToEdit.price}
                    onChange={(e) => setPlanToEdit({ ...planToEdit, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm font-semibold disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Billing Period</label>
                  <select
                    value={planToEdit.billingPeriod}
                    disabled={planToEdit.id === "free" || planToEdit.id === "corporate"}
                    onChange={(e) => setPlanToEdit({ ...planToEdit, billingPeriod: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-slate-300 focus:outline-none focus:border-portal-primary text-sm cursor-pointer disabled:opacity-50"
                  >
                    <option value="always">Always Free</option>
                    <option value="month">Per Month</option>
                    <option value="year">Per Year</option>
                    <option value="custom">Custom Billing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Status</label>
                  <select
                    value={planToEdit.active ? "true" : "false"}
                    onChange={(e) => setPlanToEdit({ ...planToEdit, active: e.target.value === "true" })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-slate-300 focus:outline-none focus:border-portal-primary text-sm cursor-pointer"
                  >
                    <option value="true">Active Plan</option>
                    <option value="false">Inactive Plan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Features List (One feature per line)</label>
                <textarea
                  rows={5}
                  value={editedFeatures}
                  onChange={(e) => setEditedFeatures(e.target.value)}
                  placeholder="e.g. Access to all courses"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-sm font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-portal-border/60">
              <button
                type="button"
                onClick={() => setPlanToEdit(null)}
                className="flex-grow flex-1 py-3 rounded-xl border border-portal-border hover:bg-slate-900 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingAction}
                className="flex-grow flex-1 py-3 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {submittingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Tier Config</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
