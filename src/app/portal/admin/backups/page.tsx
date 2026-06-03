"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments, logAdminAction } from "@/lib/services/firestoreService";
import {
  Database,
  ArrowLeft,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Award,
  CreditCard,
  History,
  ShieldAlert
} from "lucide-react";

export default function BackupCenterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  if (!user || user.role !== "admin") return null;

  // Safe CSV Escaping function
  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return "";
    let str = String(val);
    
    // Prevent CSV Formula Injection
    if (
      str.startsWith("=") ||
      str.startsWith("+") ||
      str.startsWith("-") ||
      str.startsWith("@")
    ) {
      str = "'" + str;
    }
    
    // Escape double quotes
    str = str.replace(/"/g, '""');
    
    // Wrap in double quotes
    return `"${str}"`;
  };

  const handleExportCollection = async (collectionName: string) => {
    setIsExporting(collectionName);
    try {
      const documents = await queryDocuments(collectionName);
      
      if (documents.length === 0) {
        showToast("error", `No records found in "${collectionName}" to export.`);
        setIsExporting(null);
        return;
      }

      // Define header mappings based on collection
      let headers: string[] = [];
      let rowMapper: (doc: any) => any[] = () => [];

      switch (collectionName) {
        case "users":
          headers = ["UID", "Full Name", "Username", "Email", "Role", "Created At"];
          rowMapper = (doc) => [
            doc.uid || doc.id || "",
            doc.fullName || "",
            doc.username || "",
            doc.email || "",
            doc.role || "free",
            doc.createdAt || ""
          ];
          break;
        case "courses":
          headers = ["ID", "Title", "Description", "Category", "Type", "Duration", "Instructor", "Created At"];
          rowMapper = (doc) => [
            doc.id || "",
            doc.title || "",
            doc.description || "",
            doc.category || "",
            doc.type || "free",
            doc.duration || "",
            doc.instructor || "",
            doc.createdAt || ""
          ];
          break;
        case "resources":
          headers = ["ID", "Title", "Description", "Category", "Access Level", "Drive Link", "Created At"];
          rowMapper = (doc) => [
            doc.id || "",
            doc.title || "",
            doc.description || "",
            doc.category || "",
            doc.accessLevel || "free",
            doc.driveLink || "",
            doc.createdAt || ""
          ];
          break;
        case "certificates":
          headers = ["Certificate ID", "User ID", "Course ID", "Course Name", "Issued At", "Verification Code", "Instructor", "Category"];
          rowMapper = (doc) => [
            doc.certificateId || doc.id || "",
            doc.userId || "",
            doc.courseId || "",
            doc.courseName || "",
            doc.issuedAt || "",
            doc.verificationCode || "",
            doc.instructor || "",
            doc.category || ""
          ];
          break;
        case "payments":
          headers = ["Payment ID", "Razorpay Order ID", "Razorpay Payment ID", "User ID", "Amount (INR)", "Currency", "Status", "Created At"];
          rowMapper = (doc) => [
            doc.paymentId || doc.id || "",
            doc.razorpayOrderId || "",
            doc.razorpayPaymentId || "",
            doc.userId || "",
            doc.amount || 0,
            doc.currency || "INR",
            doc.status || "",
            doc.createdAt || ""
          ];
          break;
        case "subscriptions":
          headers = ["User ID", "Plan", "Status", "Start Date", "Expiry Date", "Payment ID"];
          rowMapper = (doc) => [
            doc.userId || doc.id || "",
            doc.plan || "",
            doc.status || "",
            doc.startDate || "",
            doc.expiryDate || "",
            doc.paymentId || ""
          ];
          break;
        case "audit_logs":
          headers = ["Log ID", "Admin ID", "Admin Email", "Action", "Details", "Timestamp"];
          rowMapper = (doc) => [
            doc.id || "",
            doc.adminId || "",
            doc.adminEmail || "",
            doc.action || "",
            doc.details || "",
            doc.timestamp || ""
          ];
          break;
        default:
          throw new Error("Unsupported collection type");
      }

      // Convert to CSV string
      const csvLines = [
        headers.map(escapeCSV).join(","),
        ...documents.map((doc) => rowMapper(doc).map(escapeCSV).join(","))
      ];
      const csvContent = "\uFEFF" + csvLines.join("\n"); // prepending BOM for UTF-8 Excel support

      // Trigger file download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `nextgen_backup_${collectionName}_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log Admin Action
      await logAdminAction(
        user.uid,
        user.email || "admin@nextgen.com",
        "DATABASE_BACKUP_EXPORT",
        `Exported database collection as CSV: ${collectionName}`
      );

      showToast("success", `Collection "${collectionName}" exported successfully!`);
    } catch (err: any) {
      console.error(`Export failed for ${collectionName}:`, err);
      showToast("error", err.message || `Failed to export collection: ${collectionName}`);
    } finally {
      setIsExporting(null);
    }
  };

  const backupCards = [
    {
      id: "users",
      title: "User Directories",
      desc: "Full profile names, emails, roles, credentials metadata and enrollment states.",
      icon: Users,
      color: "text-brand-orange bg-brand-orange/10 border-brand-orange/20"
    },
    {
      id: "courses",
      title: "Course Catalog",
      desc: "LMS training program descriptions, instructor logs, level requirements, and metadata.",
      icon: Award,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
    },
    {
      id: "resources",
      title: "Resource Guides",
      desc: "Secure download guides, access tiers, description summaries, and drive link paths.",
      icon: FileText,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
    },
    {
      id: "certificates",
      title: "Granted Credentials",
      desc: "Unique verification IDs, hashes, date records, and instructor registries.",
      icon: Award,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20"
    },
    {
      id: "payments",
      title: "Payments Ledger",
      desc: "Successful financial checkout events, gateway receipt references, and currency amounts.",
      icon: CreditCard,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    },
    {
      id: "subscriptions",
      title: "User Subscriptions",
      desc: "Active/expired premium access logs, custom expiration dates, and tier plan ids.",
      icon: Award,
      color: "text-brand-blue bg-brand-blue/10 border-brand-blue/20"
    },
    {
      id: "audit_logs",
      title: "Platform Audit Trail",
      desc: "Administrative log actions, diagnostic flags, security overrides, and timestamps.",
      icon: History,
      color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
    }
  ];

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
      <div className="border-b border-portal-border/60 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl flex items-center gap-2">
            <Database className="w-8 h-8 text-portal-primary" />
            <span>Database Backup Center</span>
          </h1>
          <p className="text-sm text-portal-text-secondary mt-1">
            Export secure CSV files of primary LMS collections with formula injection filtering.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
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

      {/* Warning Box */}
      <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl flex gap-3 text-xs text-yellow-200/80 leading-normal max-w-3xl">
        <ShieldAlert className="w-5 h-5 text-yellow-500 flex-shrink-0" />
        <div>
          <p className="font-bold text-white uppercase text-[10px] tracking-wider mb-0.5">Sensitive Data Handling Policy</p>
          <p>
            Exports contain personally identifiable information (PII) and system settings credentials. 
            Ensure exported files are kept strictly confidential and shared only via encrypted platform channels.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {backupCards.map((card) => {
          const Icon = card.icon;
          const exporting = isExporting === card.id;

          return (
            <div
              key={card.id}
              className="bg-portal-card border border-portal-border/60 rounded-3xl p-6 flex flex-col justify-between hover:border-portal-primary/30 transition-all duration-300 shadow-lg relative overflow-hidden group"
            >
              <div className="space-y-3">
                <div className={`p-3 rounded-xl inline-block border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-portal-primary transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-portal-text-secondary leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-portal-border/40">
                <button
                  onClick={() => handleExportCollection(card.id)}
                  disabled={!!isExporting}
                  className="w-full py-2.5 rounded-xl bg-slate-900 border border-portal-border hover:border-portal-primary text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-portal-primary" />
                      <span>Exporting CSV...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
