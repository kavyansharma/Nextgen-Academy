"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments, getDocument } from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";
import { jsPDF } from "jspdf";
import {
  CreditCard,
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Search,
  ArrowUpDown,
  Download,
  ShieldCheck,
  ArrowRight,
  Mail,
  Zap
} from "lucide-react";

interface Subscription {
  userId: string;
  plan: "free" | "premium_monthly" | "premium_yearly" | "corporate" | "premium";
  status: "active" | "expired" | "cancelled" | "refunded";
  startDate: string;
  expiryDate: string;
  paymentId?: string;
}

interface Payment {
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

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => Promise<void>;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayWindow extends Window {
  Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
}

type SortField = "createdAt" | "amount";
type SortOrder = "asc" | "desc";

export default function PaymentDetailsPage() {
  const { user, firebaseUser, refreshUser } = useAuth();

  // Component States
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search & Sorting States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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

  // Toast Helper
  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Load Data
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      console.log("[loadData] Initiating Firestore reads for UID:", user.uid);

      // 1. Fetch user subscription
      console.log("[loadData] Reading 'subscriptions' document for UID:", user.uid);
      const subDoc = await getDocument("subscriptions", user.uid) as Subscription | null;
      console.log("[loadData] 'subscriptions' read finished successfully. Data:", subDoc);
      setSubscription(subDoc);

      // 2. Fetch user payments
      console.log("[loadData] Querying 'payments' documents for userId:", user.uid);
      const paymentsList = await queryDocuments("payments", where("userId", "==", user.uid)) as Payment[];
      console.log("[loadData] 'payments' query finished successfully. Count:", paymentsList.length);
      setPayments(paymentsList);

    } catch (err: any) {
      console.error("Error loading payment details:", err);
      console.error("FIRESTORE_ERROR_CODE:", err?.code);
      console.error("FIRESTORE_ERROR_MESSAGE:", err?.message);
      showToast("error", "Failed to retrieve billing configurations.");
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      if (user) {
        loadData();
      }
    };
    run();
  }, [user, loadData]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Filtered & Sorted Payments
  const processedPayments = useMemo(() => {
    let result = [...payments];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.paymentId.toLowerCase().includes(query) ||
          p.razorpayPaymentId?.toLowerCase().includes(query) ||
          p.status.toLowerCase().includes(query)
      );
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === "amount") {
        comparison = a.amount - b.amount;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [payments, searchQuery, sortField, sortOrder]);

  // Razorpay Upgrade Trigger
  const handleUpgrade = async (planId: "premium_monthly" | "premium_yearly", price: number) => {
    if (!firebaseUser || !user) return;
    setIsCheckoutProcessing(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      
      // Initialize order on server
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          amount: price,
          currency: "INR"
        })
      });

      if (!res.ok) {
        throw new Error("Failed to initialize payment gateway order.");
      }

      const orderData = await res.json();

      // Configure Razorpay options
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "NextGen Academy",
        description: `Upgrade Plan: ${planId === "premium_monthly" ? "Premium Monthly" : "Premium Yearly"}`,
        order_id: orderData.id,
        handler: async (response) => {
          setIsCheckoutProcessing(true);
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
                amount: price,
                currency: "INR",
                plan: planId
              })
            });

            if (verifyRes.ok) {
              await refreshUser();
              showToast("success", "Congratulations! Plan upgraded and premium badge active!");
              loadData();
            } else {
              showToast("error", "Payment verification failed. Please contact billing support.");
            }
          } catch (err) {
            console.error("Verification Call Failed:", err);
            showToast("error", "Verification process encountered an error.");
          } finally {
            setIsCheckoutProcessing(false);
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

      const rzp = new (window as unknown as RazorpayWindow).Razorpay(options);
      rzp.open();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to initiate transaction.";
      console.error("Razorpay trigger error:", err);
      showToast("error", errorMsg);
    } finally {
      setIsCheckoutProcessing(false);
    }
  };

  // PDF Invoice Download
  const handleDownloadInvoice = (payment: Payment) => {
    try {
      const doc = new jsPDF();

      // NextGen Academy Corporate Branding Colors

      // NextGen Logo Symbol
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(14, 15, 12, 12, 2.5, 2.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("NG", 17, 23);

      // NextGen Academy Text
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(16);
      doc.text("NEXTGEN ACADEMY", 30, 21);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Professional Engineering LMS Platform", 30, 25);

      // Invoice Header Info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("INVOICE", 150, 21);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Invoice No: INV-${payment.paymentId.substring(4, 12)}`, 150, 26);
      doc.text(`Date: ${new Date(payment.createdAt).toLocaleDateString()}`, 150, 31);

      // Divider Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(14, 38, 196, 38);

      // Billing details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("BILLED TO:", 14, 46);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(user?.fullName || "Student Profile", 14, 52);
      doc.text(user?.email || "Email", 14, 57);

      // Company details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("ISSUED BY:", 120, 46);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("NextGen Academy Ltd.", 120, 52);
      doc.text("info@nextgen-consulting.com", 120, 57);
      doc.text("GSTIN: 27AAAAA1111A1Z1", 120, 62);

      // Table Header
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(14, 75, 182, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Plan Description", 16, 80);
      doc.text("Transaction ID", 80, 80);
      doc.text("Qty", 140, 80);
      doc.text("Price", 160, 80);
      doc.text("Total", 180, 80);

      // Determine Plan name
      let planName = "Premium Plan Upgrade";
      if (payment.amount === 999) {
        planName = "Premium Monthly Membership";
      } else if (payment.amount === 7999) {
        planName = "Premium Yearly Membership";
      }

      // Table Row
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(planName, 16, 91);
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.text(payment.razorpayPaymentId || payment.paymentId, 80, 91);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("1", 142, 91);
      doc.text(`INR ${payment.amount}`, 160, 91);
      doc.text(`INR ${payment.amount}`, 180, 91);

      // Divider below item
      doc.setDrawColor(241, 245, 249);
      doc.line(14, 96, 196, 96);

      // Totals
      const subtotal = payment.amount;
      const gst = Number((subtotal * 0.18).toFixed(2)); // 18% GST
      const grandTotal = subtotal + gst;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Subtotal:", 140, 107);
      doc.text(`INR ${subtotal}`, 180, 107);

      doc.text("GST (18%):", 140, 113);
      doc.text(`INR ${gst}`, 180, 113);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Grand Total:", 140, 120);
      doc.text(`INR ${grandTotal}`, 180, 120);

      // Digital Seal Watermark
      doc.setFillColor(254, 243, 199); // amber-100
      doc.setDrawColor(251, 191, 36); // amber-400
      doc.setLineWidth(0.5);
      doc.circle(50, 125, 12, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(217, 119, 6);
      doc.text("PAID", 50, 126.5, { align: "center" });

      // Footer Terms
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Terms & Conditions:", 14, 155);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("1. All subscription plans are non-refundable once activated.", 14, 161);
      doc.text("2. Membership is auto-renewed unless cancelled by user.", 14, 166);
      doc.text("3. For any billing queries, email billing@nextgen-consulting.com.", 14, 171);

      // Verified footer banner
      doc.setFillColor(15, 23, 42);
      doc.rect(14, 275, 182, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("THANK YOU FOR YOUR PATRONAGE - NEXTGEN ACADEMY", 105, 281.5, { align: "center" });

      doc.save(`invoice-${payment.razorpayPaymentId || payment.paymentId}.pdf`);
      showToast("success", "Invoice PDF downloaded successfully.");
    } catch (err) {
      console.error("Failed to generate PDF invoice:", err);
      showToast("error", "Failed to generate and download invoice.");
    }
  };

  if (!user) return null;

  // Active Billing Badges & Formatting
  const getPlanDetails = () => {
    if (user.role === "admin") {
      return {
        label: "ADMIN ACCESS",
        badge: "bg-portal-primary/10 border-portal-primary/20 text-portal-primary",
        desc: "LMS Platform Administrator"
      };
    }
    
    const plan = subscription?.plan;
    if (user.role === "paid" || (subscription && subscription.status === "active")) {
      if (plan === "premium_monthly") {
        return {
          label: "PREMIUM MONTHLY",
          badge: "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400 shadow-sm",
          desc: "Premium Monthly Access"
        };
      } else if (plan === "premium_yearly" || plan === "premium") {
        return {
          label: "PREMIUM YEARLY",
          badge: "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400 shadow-sm",
          desc: "Premium Yearly Access"
        };
      } else if (plan === "corporate") {
        return {
          label: "CORPORATE TIER",
          badge: "bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/20 text-purple-400 shadow-sm",
          desc: "Corporate Enterprise Membership"
        };
      }
      return {
        label: "PREMIUM MEMBER",
        badge: "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400",
        desc: "Premium Tier Access"
      };
    }
    
    return {
      label: "FREE MEMBER",
      badge: "bg-slate-800/40 border-slate-700/60 text-slate-400",
      desc: "Free Learning Tier"
    };
  };

  const planDetails = getPlanDetails();
  const isPremiumUser = user.role === "admin" || user.role === "paid" || (subscription && subscription.status === "active");

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans">
      {/* Header */}
      <div className="border-b border-portal-border/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-portal-secondary animate-pulse" />
            <span>Payment Details</span>
          </h1>
          <p className="text-sm text-portal-text-secondary mt-1">Review active memberships, download professional invoices, and upgrade learning privileges.</p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2.5 rounded-xl border border-portal-border hover:border-slate-500 bg-slate-900 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
        >
          <Loader2 className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sync Records</span>
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

      {loading ? (
        <div className="p-16 text-center text-portal-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-portal-primary mb-3" />
          <span>Assembling ledger entries...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Billing Summary Card */}
          <div className="p-6 rounded-3xl bg-portal-card border border-portal-border/60 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-portal-secondary/5 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center relative z-10">
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${planDetails.badge}`}>
                    {planDetails.label}
                  </span>
                  {isPremiumUser && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-portal-secondary uppercase">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified Premium
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-extrabold text-white">{planDetails.desc}</h2>
                <p className="text-xs text-portal-text-secondary">NextGen Academy verified credentials and learning paths remain active while your account status is verified.</p>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-portal-border/40 pt-4 md:pt-0 md:pl-6 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-portal-text-secondary">Status</p>
                <p className={`text-md font-extrabold ${subscription?.status === "active" || user.role === "admin" ? "text-portal-success" : "text-slate-400"}`}>
                  {user.role === "admin" ? "Platform Owner" : subscription?.status === "active" ? "Active (Paid)" : "Free (Inactive)"}
                </p>
                <p className="text-[10px] text-portal-text-secondary mt-1">
                  Enrolled: {subscription?.startDate ? new Date(subscription.startDate).toLocaleDateString() : "N/A"}
                </p>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-portal-border/40 pt-4 md:pt-0 md:pl-6 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-portal-text-secondary">Billing Expiration</p>
                <p className="text-md font-extrabold text-white">
                  {user.role === "admin" ? "Always Open" : subscription?.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : "Lifetime Free"}
                </p>
                <p className="text-[10px] text-portal-text-secondary mt-1">
                  Billing cycle renewal occurs on cycle date.
                </p>
              </div>
            </div>
          </div>

          {/* Payments & Invoices Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-portal-primary" />
                <span>Transaction History</span>
              </h2>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-portal-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search invoice or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/60 border border-portal-border/60 text-white placeholder-slate-500 focus:outline-none focus:border-portal-primary text-xs"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-portal-card border border-portal-border/60 shadow-xl rounded-2xl">
              {processedPayments.length === 0 ? (
                <div className="p-16 text-center text-portal-text-secondary space-y-6">
                  <div className="inline-flex w-14 h-14 rounded-2xl bg-portal-primary/5 border border-portal-border/60 items-center justify-center text-slate-550">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-white text-md">No Payments Found</p>
                    <p className="text-xs text-portal-text-secondary max-w-sm mx-auto">No transaction records were located under this student profile. Upgrade to a paid plan below to begin learning.</p>
                  </div>
                  <a
                    href="#upgrade-section"
                    className="inline-flex px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-xs font-bold text-white transition-all shadow-md"
                  >
                    Upgrade Membership
                  </a>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-portal-border/60 font-bold text-portal-text-secondary uppercase tracking-wider bg-slate-950/45">
                      <th className="p-4.5 pl-6">
                        <button onClick={() => handleSort("createdAt")} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                          <span>Transaction Date</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="p-4.5">Plan / Description</th>
                      <th className="p-4.5">Transaction ID</th>
                      <th className="p-4.5">
                        <button onClick={() => handleSort("amount")} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                          <span>Amount</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="p-4.5">Status</th>
                      <th className="p-4.5 pr-6 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-portal-border/30">
                    {processedPayments.map((pay) => {
                      let planName = "Premium Upgrade";
                      if (pay.amount === 999) planName = "Premium Monthly";
                      else if (pay.amount === 7999) planName = "Premium Yearly";

                      let statusBadge = "bg-portal-success/10 border-portal-success/20 text-portal-success";
                      if (pay.status === "failed") statusBadge = "bg-red-500/10 border-red-500/20 text-red-400";
                      else if (pay.status === "refunded") statusBadge = "bg-amber-500/10 border-amber-500/20 text-amber-400";

                      return (
                        <tr key={pay.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="p-4.5 pl-6 font-medium text-white">
                            {new Date(pay.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4.5 text-slate-300 font-semibold">{planName}</td>
                          <td className="p-4.5 font-mono text-portal-secondary select-all">
                            {pay.razorpayPaymentId || pay.paymentId}
                          </td>
                          <td className="p-4.5 text-white font-extrabold">₹{pay.amount.toLocaleString()}</td>
                          <td className="p-4.5">
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase ${statusBadge}`}>
                              {pay.status}
                            </span>
                          </td>
                          <td className="p-4.5 pr-6 text-right">
                            {pay.status === "success" ? (
                              <button
                                onClick={() => handleDownloadInvoice(pay)}
                                className="p-2 rounded-xl bg-slate-900 border border-portal-border hover:border-portal-secondary text-portal-text-secondary hover:text-white transition-colors cursor-pointer"
                                title="Download PDF Invoice"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600 italic">No Invoice</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Upgrade Membership Section */}
          <div id="upgrade-section" className="space-y-4 pt-6 border-t border-portal-border/40">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-portal-warning" />
              <span>Available Upgrade Plans</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Premium Monthly */}
              <div className="p-6 rounded-3xl bg-portal-card border border-portal-border/60 shadow-lg flex flex-col justify-between hover:border-portal-secondary/30 hover:scale-[1.01] transition-all duration-300 relative group">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-lg">Premium Monthly</h3>
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase border bg-portal-secondary/10 border-portal-secondary/20 text-portal-secondary">
                      Popular
                    </span>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-white">₹999</span>
                    <span className="text-xs text-portal-text-secondary"> / month</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-portal-text-secondary pt-4 border-t border-portal-border/30">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-portal-success flex-shrink-0" />
                      <span>Unlimited Course Access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-portal-success flex-shrink-0" />
                      <span>Premium Engineering Resources</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-portal-success flex-shrink-0" />
                      <span>Priority Support Desk</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-portal-success flex-shrink-0" />
                      <span>Verified Credentials</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-portal-success flex-shrink-0" />
                      <span>Public Forums Access</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => handleUpgrade("premium_monthly", 999)}
                    disabled={isCheckoutProcessing}
                    className="w-full py-3 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isCheckoutProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Upgrade Monthly</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Premium Yearly */}
              <div className="p-6 rounded-3xl bg-portal-card border border-portal-border/60 shadow-lg flex flex-col justify-between hover:border-portal-secondary/30 hover:scale-[1.01] transition-all duration-300 relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-portal-primary/5 rounded-full blur-2xl"></div>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-lg">Premium Yearly</h3>
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase border bg-portal-success/10 border-portal-success/20 text-portal-success animate-pulse">
                      Best Value
                    </span>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-white">₹7,999</span>
                    <span className="text-xs text-portal-text-secondary"> / year</span>
                    <p className="text-[10px] text-portal-success font-bold mt-1">Save over 33% compared to monthly!</p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-portal-text-secondary pt-4 border-t border-portal-border/30">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-portal-success flex-shrink-0" />
                      <span>Unlimited Course Access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-portal-success flex-shrink-0" />
                      <span>Premium Engineering Resources</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-portal-success flex-shrink-0" />
                      <span>Priority Support Desk</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-portal-success flex-shrink-0" />
                      <span>Verified Credentials</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-portal-success flex-shrink-0" />
                      <span>Public Forums Access</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 relative z-10">
                  <button
                    onClick={() => handleUpgrade("premium_yearly", 7999)}
                    disabled={isCheckoutProcessing}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-portal-primary to-portal-secondary hover:opacity-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isCheckoutProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Upgrade Yearly</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Corporate Plan */}
              <div className="p-6 rounded-3xl bg-portal-card border border-portal-border/60 shadow-lg flex flex-col justify-between hover:border-portal-secondary/30 hover:scale-[1.01] transition-all duration-300 relative group">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-lg">Corporate Plan</h3>
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase border bg-purple-500/10 border-purple-500/20 text-purple-400">
                      Teams
                    </span>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-white">Custom</span>
                    <span className="text-xs text-portal-text-secondary"> / enterprise</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-portal-text-secondary pt-4 border-t border-portal-border/30">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>Bulk seats and team portals</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>Dedicated LMS account manager</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>Advanced analytics dashboard</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>Enterprise SLA Support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>Custom brand certifications</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <Link
                    href="/portal/support?subject=Corporate%20Plan%20Enterprise%20Inquiry&message=Hello%20NextGen%20Support%2C%20I%20am%20interested%20in%20upgrading%20our%20team%20to%20a%20Corporate%20LMS%20membership.%20Please%20send%20us%20pricing%20details%20for%20our%20group."
                    className="w-full py-3 rounded-xl bg-slate-900 border border-portal-border hover:border-purple-400 hover:bg-purple-950/15 text-slate-200 hover:text-purple-300 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Contact Support</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
