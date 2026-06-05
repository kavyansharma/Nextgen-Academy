"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments, setDocument, logAdminAction } from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send,
  History,
  Info,
  Bell
} from "lucide-react";

interface CommunicationDoc {
  id: string;
  title: string;
  body: string;
  targetRole: string;
  sentAsNotification: boolean;
  sentAsEmail: boolean;
  createdAt: string;
  senderEmail: string;
}

export default function CommunicationsCenterPage() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();

  // Page States
  const [history, setHistory] = useState<CommunicationDoc[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form States
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [sentAsNotification, setSentAsNotification] = useState(true);
  const [sentAsEmail, setSentAsEmail] = useState(false);

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

  const loadHistory = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    try {
      setLoadingHistory(true);
      const list = await queryDocuments("communications") as CommunicationDoc[];
      const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(sorted);
    } catch (err) {
      console.error("Error loading communications history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      loadHistory();
    };
    run();
  }, [loadHistory]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  if (!user || user.role !== "admin") return null;

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast("error", "Subject and message contents cannot be empty.");
      return;
    }
    if (!sentAsNotification && !sentAsEmail) {
      showToast("error", "Please select at least one delivery channel (Notification or Email).");
      return;
    }

    setSubmitting(true);
    try {
      if (!firebaseUser) {
        showToast("error", "No active login session detected.");
        setSubmitting(false);
        return;
      }
      const idToken = await firebaseUser.getIdToken();

      interface BroadcastUser {
        id: string;
        uid?: string;
        email?: string;
        role?: string;
      }

      // 1. Fetch targeted users
      let targetedUsers: BroadcastUser[] = [];
      if (targetRole === "all") {
        targetedUsers = await queryDocuments("users") as BroadcastUser[];
      } else {
        targetedUsers = await queryDocuments("users", where("role", "==", targetRole)) as BroadcastUser[];
      }

      if (targetedUsers.length === 0) {
        showToast("error", `No users match the target role "${targetRole.toUpperCase()}".`);
        setSubmitting(false);
        return;
      }

      // 2. Dispatch In-App Notifications
      if (sentAsNotification) {
        const notifPromises = targetedUsers.map((u: BroadcastUser) => {
          const notifId = `NOTIF-BCAST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          return setDocument("notifications", notifId, {
            userId: u.uid || u.id,
            title: title,
            message: body,
            type: "announcement",
            read: false,
            createdAt: new Date().toISOString()
          });
        });
        await Promise.all(notifPromises);
      }

      // 3. Dispatch Email Broadcast via Server API
      if (sentAsEmail) {
        const response = await fetch("/api/admin/broadcast", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`
          },
          body: JSON.stringify({
            title,
            messageContent: body,
            targetRole
          })
        });

        if (!response.ok) {
          throw new Error("Failed to dispatch email broadcast via server.");
        }
      }

      // 4. Save Communication Record
      const commId = `COMM-${Date.now()}`;
      await setDocument("communications", commId, {
        title,
        body,
        targetRole,
        sentAsNotification,
        sentAsEmail,
        createdAt: new Date().toISOString(),
        senderEmail: user.email || "admin@nextgen.com"
      });

      // 5. Log Admin Action
      await logAdminAction(
        user.uid,
        user.email || "admin@nextgen.com",
        "BROADCAST_COMMUNICATION",
        `Sent announcement: "${title}" targeting ${targetRole} users. Channels: ${
          sentAsNotification ? "Notification " : ""
        }${sentAsEmail ? "Email" : ""}`
      );

      showToast("success", "Broadcast communication dispatched successfully!");
      setTitle("");
      setBody("");
      loadHistory();
    } catch (err) {
      console.error("Broadcast send failure:", err);
      showToast("error", (err as Error).message || "Failed to dispatch broadcast.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-portal-text-primary">
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
      <div className="border-b border-portal-border pb-6">
        <h1 className="text-3xl font-extrabold text-portal-text-primary tracking-tight sm:text-4xl flex items-center gap-2">
          <Mail className="w-8 h-8 text-portal-primary" />
          <span>Communications Center</span>
        </h1>
        <p className="text-sm text-portal-text-secondary mt-1">
          Broadcast announcements, notifications, and emails to targeted user groups.
        </p>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex gap-3 p-4 rounded-xl text-sm border shadow-lg animate-fade-in ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Panel */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSendBroadcast} className="p-6 rounded-2xl bg-white border border-portal-border space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary border-b border-portal-border pb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-portal-primary" />
              <span>Compose Broadcast</span>
            </h3>

            {/* Target select */}
            <div>
              <label className="block text-[10px] font-bold text-portal-text-secondary uppercase mb-1.5">Target Audience</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary text-xs font-semibold cursor-pointer"
              >
                <option value="all">All Users (Free + Paid + Admin)</option>
                <option value="free">Free Tier Users Only</option>
                <option value="paid">Paid Premium Users Only</option>
                <option value="admin">Administrators Only</option>
              </select>
            </div>

            {/* Channels checkboxes */}
            <div className="space-y-2.5 py-1">
              <span className="block text-[10px] font-bold text-portal-text-secondary uppercase">Delivery Channels</span>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 text-xs text-portal-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sentAsNotification}
                    onChange={(e) => setSentAsNotification(e.target.checked)}
                    className="rounded text-portal-primary focus:ring-portal-primary bg-white border-portal-border"
                  />
                  <div className="flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-portal-secondary" />
                    <span>In-App Notification Banner</span>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-portal-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sentAsEmail}
                    onChange={(e) => setSentAsEmail(e.target.checked)}
                    className="rounded text-portal-primary focus:ring-portal-primary bg-white border-portal-border"
                  />
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-portal-primary" />
                    <span>Resend Email Broadcast Newsletter</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[10px] font-bold text-portal-text-secondary uppercase mb-1.5">Announcement Title / Subject</label>
              <input
                type="text"
                required
                placeholder="e.g. Server Maintenance Notice"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary text-xs font-semibold"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-[10px] font-bold text-portal-text-secondary uppercase mb-1.5">Message Content</label>
              <textarea
                rows={6}
                required
                placeholder="Compose announcement details here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-portal-border text-portal-text-primary focus:outline-none focus:border-portal-primary text-xs font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Broadcast...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast Announcement</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right History Panel */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-portal-border space-y-4 shadow-sm h-[580px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary border-b border-portal-border pb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-portal-secondary animate-pulse" />
              <span>Broadcast Dispatch History</span>
            </h3>

            <div className="divide-y divide-portal-border/30 overflow-y-auto max-h-[460px] pr-1.5 scrollbar-thin">
              {loadingHistory ? (
                <div className="p-12 text-center text-portal-text-secondary">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-portal-primary mb-2" />
                  <span>Reading history trail...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="p-12 text-center text-portal-text-secondary space-y-2">
                  <Info className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-portal-text-primary text-xs">No Broadcast Logs</p>
                  <p className="text-[11px]">Announcements composed will appear here in chronological order.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="py-4 space-y-2 text-xs">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-portal-text-primary text-sm line-clamp-1">{item.title}</h4>
                        <span className="text-[9px] text-portal-text-secondary font-semibold">
                          By {item.senderEmail} &bull; {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-blue-50 border border-blue-100 text-blue-700">
                        Target: {item.targetRole.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-portal-text-secondary leading-normal text-xs whitespace-pre-wrap">{item.body}</p>
                    <div className="flex items-center gap-4 pt-1">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase ${
                        item.sentAsNotification ? "text-portal-success" : "text-slate-650"
                      }`}>
                        <Bell className="w-3 h-3" />
                        <span>Notification</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase ${
                        item.sentAsEmail ? "text-portal-success" : "text-slate-650"
                      }`}>
                        <Mail className="w-3 h-3" />
                        <span>Email Blast</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
