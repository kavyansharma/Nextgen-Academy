"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  queryDocuments,
  updateDocument,
  logAdminAction,
  addDocument
} from "@/lib/services/firestoreService";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CreditCard,
  Search,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  Eye,
  X,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

interface PaymentDoc {
  id: string;
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  userId: string;
  amount: number;
  currency: string;
  status: "success" | "refunded" | "failed";
  createdAt: string;
}

interface UserDoc {
  id: string;
  name?: string;
  email: string;
  role: string;
}

export default function AdminPaymentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Lists
  const [payments, setPayments] = useState<PaymentDoc[]>([]);
  const [users, setUsers] = useState<Record<string, UserDoc>>({});
  const [loadingData, setLoadingData] = useState(true);

  // Selected Payment for Modal detail view
  const [selectedPayment, setSelectedPayment] = useState<PaymentDoc | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const loadData = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    try {
      setLoadingData(true);
      // Fetch payments and users
      const paymentsList = (await queryDocuments("payments")) as PaymentDoc[];
      const sortedPayments = paymentsList.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPayments(sortedPayments);

      const usersList = (await queryDocuments("users")) as UserDoc[];
      const usersMap: Record<string, UserDoc> = {};
      usersList.forEach((u) => {
        usersMap[u.id] = u;
      });
      setUsers(usersMap);
    } catch (err) {
      console.error("Error loading payments data:", err);
      showToast("error", "Failed to retrieve payment records.");
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      loadData();
    };
    run();
  }, [loadData]);

  if (!user || user.role !== "admin") return null;

  // Process Refund (simulate updating status, downgrading user subscription/role, writing audit & notification docs)
  const handleRefundPayment = async (payment: PaymentDoc) => {
    if (
      !confirm(
        `Are you sure you want to refund payment ${payment.paymentId} of ₹${(
          payment.amount / 100
        ).toFixed(2)}?\nThis will downgrade the user's role to 'free' and cancel their active subscription.`
      )
    ) {
      return;
    }

    setSubmittingAction(true);
    try {
      // 1. Update Payment Status to 'refunded'
      await updateDocument("payments", payment.id, {
        status: "refunded",
      });

      // 2. Try to find and cancel user subscription (doc ID is userId)
      const subRef = doc(db, "subscriptions", payment.userId);
      const subSnap = await getDoc(subRef);
      if (subSnap.exists()) {
        await updateDoc(subRef, {
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        });
      }

      // 3. Downgrade user role to 'free'
      const userRef = doc(db, "users", payment.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          role: "free",
          updatedAt: new Date().toISOString(),
        });
      }

      // 4. Log Audit Action
      await logAdminAction(
        user.uid,
        user.email || "admin@nextgen.com",
        "PAYMENT_REFUND",
        `Refunded payment: ${payment.paymentId} (${payment.razorpayPaymentId}) for User: ${payment.userId}. Downgraded role to free.`
      );

      // 5. Send User Notification
      await addDocument("notifications", {
        userId: payment.userId,
        title: "Membership Refunded",
        message: `Your payment of ₹${(payment.amount / 100).toFixed(
          2
        )} has been refunded, and your premium access has been cancelled.`,
        type: "subscription",
        read: false,
        createdAt: new Date().toISOString(),
      });

      showToast("success", "Refund processed successfully!");
      setSelectedPayment(null);
      loadData();
    } catch (err: any) {
      console.error("Refund processing error:", err);
      showToast("error", err.message || "Failed to process refund.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Search filter
  const filteredPayments = payments.filter((pay) => {
    const customer = users[pay.userId];
    const customerEmail = customer?.email?.toLowerCase() || "";
    const customerName = customer?.name?.toLowerCase() || "";
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      pay.paymentId.toLowerCase().includes(query) ||
      pay.razorpayOrderId.toLowerCase().includes(query) ||
      pay.razorpayPaymentId.toLowerCase().includes(query) ||
      customerEmail.includes(query) ||
      customerName.includes(query) ||
      pay.userId.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "all" || pay.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalRevenue = payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + p.amount / 100, 0);

  const totalRefunded = payments
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + p.amount / 100, 0);

  const successfulCount = payments.filter((p) => p.status === "success").length;
  const refundedCount = payments.filter((p) => p.status === "refunded").length;

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Back link */}
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
          <CreditCard className="w-8 h-8 text-portal-primary" />
          <span>Payments Ledger</span>
        </h1>
        <p className="text-sm text-portal-text-secondary mt-1">
          Review premium upgrades, track Razorpay checkout sessions, issue manual refunds, and audit transaction records.
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

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-portal-card border border-portal-border/60 p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-xs text-portal-text-secondary font-bold uppercase tracking-wider">Net Sales Revenue</span>
            <h3 className="text-2xl font-black text-white">₹{totalRevenue.toLocaleString()}</h3>
            <p className="text-[10px] text-portal-success font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Includes active memberships</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-portal-success/10 text-portal-success rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Refunded Capital */}
        <div className="bg-portal-card border border-portal-border/60 p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-xs text-portal-text-secondary font-bold uppercase tracking-wider">Refunded Capital</span>
            <h3 className="text-2xl font-black text-slate-300">₹{totalRefunded.toLocaleString()}</h3>
            <p className="text-[10px] text-portal-text-secondary font-semibold">Processed from dashboard</p>
          </div>
          <div className="w-12 h-12 bg-slate-900 text-portal-warning rounded-xl flex items-center justify-center">
            <RefreshCcw className="w-5 h-5" />
          </div>
        </div>

        {/* Successful count */}
        <div className="bg-portal-card border border-portal-border/60 p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-xs text-portal-text-secondary font-bold uppercase tracking-wider">Approved Sales</span>
            <h3 className="text-2xl font-black text-white">{successfulCount}</h3>
            <p className="text-[10px] text-portal-text-secondary font-semibold">Checkout completions</p>
          </div>
          <div className="w-12 h-12 bg-portal-primary/10 text-portal-primary rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Refunds count */}
        <div className="bg-portal-card border border-portal-border/60 p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-xs text-portal-text-secondary font-bold uppercase tracking-wider">Refund Count</span>
            <h3 className="text-2xl font-black text-white">{refundedCount}</h3>
            <p className="text-[10px] text-portal-text-secondary font-semibold">Adjusted ledger entries</p>
          </div>
          <div className="w-12 h-12 bg-slate-900 text-red-400 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-900/40 p-4 border border-portal-border/60 rounded-2xl">
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-portal-text-secondary">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by Payment ID, Name, Email, Order ID..."
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
            <option value="all">All Payments</option>
            <option value="success">Success</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-portal-card border border-portal-border/60 shadow-xl rounded-2xl">
        {loadingData ? (
          <div className="p-12 text-center text-portal-text-secondary">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-portal-primary mb-3" />
            <span>Loading payments ledger...</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-portal-text-secondary space-y-2">
            <CreditCard className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="font-bold text-white">No Payments Logged</p>
            <p className="text-sm">We couldn&apos;t find any transaction matches in the system.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-portal-border/60 text-xs font-bold text-portal-text-secondary uppercase tracking-wider bg-slate-950/45">
                <th className="p-4.5 pl-6">Payment ID</th>
                <th className="p-4.5">Student Profile</th>
                <th className="p-4.5">Billing Amount</th>
                <th className="p-4.5">Date Created</th>
                <th className="p-4.5">Status</th>
                <th className="p-4.5 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border/30">
              {filteredPayments.map((pay) => {
                const customer = users[pay.userId];
                const badgeColor =
                  pay.status === "success"
                    ? "bg-portal-success/10 border-portal-success/20 text-portal-success"
                    : pay.status === "refunded"
                    ? "bg-portal-warning/10 border-portal-warning/20 text-portal-warning"
                    : "bg-red-500/10 border-red-500/20 text-red-400";

                return (
                  <tr key={pay.id} className="hover:bg-slate-900/25 transition-colors duration-150">
                    {/* ID */}
                    <td className="p-4.5 pl-6">
                      <div className="font-mono text-xs font-semibold text-white">{pay.paymentId}</div>
                      <p className="text-[10px] text-portal-text-secondary font-mono mt-0.5">
                        Order: {pay.razorpayOrderId}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="p-4.5">
                      <div className="font-bold text-slate-200">{customer?.name || "Anonymous Member"}</div>
                      <p className="text-xs text-portal-text-secondary font-medium">{customer?.email || `UID: ${pay.userId}`}</p>
                    </td>

                    {/* Amount */}
                    <td className="p-4.5 font-bold text-white">
                      ₹{(pay.amount / 100).toFixed(2)}
                    </td>

                    {/* Date */}
                    <td className="p-4.5 text-slate-300 text-xs">
                      {new Date(pay.createdAt).toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="p-4.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                        {pay.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4.5 pr-6 text-right space-x-2">
                      <button
                        onClick={() => setSelectedPayment(pay)}
                        className="inline-flex p-2 rounded-lg bg-slate-900 border border-portal-border text-portal-secondary hover:text-white transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {pay.status === "success" && (
                        <button
                          onClick={() => handleRefundPayment(pay)}
                          disabled={submittingAction}
                          className="inline-flex p-2 rounded-lg bg-slate-900 border border-portal-border text-red-400 hover:text-white hover:bg-red-500/15 transition-all cursor-pointer disabled:opacity-50"
                          title="Issue Refund"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
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

      {/* Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => {
              if (!submittingAction) setSelectedPayment(null);
            }}
          ></div>

          <div className="relative w-full max-w-lg bg-portal-card border border-portal-border rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-slate-100 space-y-5">
            <div className="flex justify-between items-center border-b border-portal-border/60 pb-3">
              <h3 className="text-lg font-bold text-white">Payment Details</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 rounded-lg text-portal-text-secondary hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-portal-border/20 font-mono text-xs">
                <div>
                  <span className="text-portal-text-secondary block font-bold uppercase tracking-wider text-[10px]">Payment ID</span>
                  <span className="text-white font-semibold">{selectedPayment.paymentId}</span>
                </div>
                <div>
                  <span className="text-portal-text-secondary block font-bold uppercase tracking-wider text-[10px]">Status</span>
                  <span
                    className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${
                      selectedPayment.status === "success"
                        ? "bg-portal-success/10 border-portal-success/20 text-portal-success"
                        : selectedPayment.status === "refunded"
                        ? "bg-portal-warning/10 border-portal-warning/20 text-portal-warning"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}
                  >
                    {selectedPayment.status}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-portal-text-secondary block font-bold uppercase tracking-wider text-[10px]">Razorpay Payment ID</span>
                  <span className="text-white break-all">{selectedPayment.razorpayPaymentId}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-portal-text-secondary block font-bold uppercase tracking-wider text-[10px]">Razorpay Order ID</span>
                  <span className="text-white break-all">{selectedPayment.razorpayOrderId}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-portal-border/30 pt-3">
                <h4 className="text-xs font-bold uppercase text-portal-text-secondary tracking-wider">Customer Details</h4>
                <div className="p-3 bg-slate-900/40 rounded-xl border border-portal-border/20 space-y-1">
                  <p className="font-bold text-white">{users[selectedPayment.userId]?.name || "Anonymous"}</p>
                  <p className="text-xs text-portal-text-secondary">Email: {users[selectedPayment.userId]?.email || "N/A"}</p>
                  <p className="text-[10px] text-portal-text-secondary font-mono">UID: {selectedPayment.userId}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-portal-border/30 pt-3">
                <h4 className="text-xs font-bold uppercase text-portal-text-secondary tracking-wider">Financial Breakdown</h4>
                <div className="flex justify-between items-center text-xs font-semibold p-2.5 bg-slate-900/40 rounded-xl border border-portal-border/20">
                  <span className="text-portal-text-secondary">Amount (INR)</span>
                  <span className="text-white font-mono text-sm font-bold">₹{(selectedPayment.amount / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-portal-border/60">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="flex-grow flex-1 py-3 rounded-xl border border-portal-border hover:bg-slate-900 text-xs font-bold transition-all"
              >
                Close details
              </button>
              {selectedPayment.status === "success" && (
                <button
                  onClick={() => handleRefundPayment(selectedPayment)}
                  disabled={submittingAction}
                  className="flex-grow flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  {submittingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Issue Refund</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
