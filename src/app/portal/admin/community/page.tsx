"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments, updateDocument, deleteDocument, addDocument } from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";
import {
  Loader2,
  Trash2,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface ReportedPost {
  id: string;
  title: string;
  content: string;
  channel: string;
  authorName: string;
  authorRole: string;
  isReported: boolean;
  createdAt: string;
}

interface ReportedReply {
  id: string;
  postId: string;
  authorName: string;
  authorRole: string;
  content: string;
  isReported: boolean;
  createdAt: string;
}

export default function AdminCommunityModerationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Gating access check
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/portal/login");
      } else if (user.role !== "admin") {
        router.replace("/portal/dashboard");
      }
    }
  }, [user, loading, router]);

  // Moderation states
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [reportedReplies, setReportedReplies] = useState<ReportedReply[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Tab State: 'posts' | 'replies'
  const [activeTab, setActiveTab] = useState<"posts" | "replies">("posts");

  // Notifications
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const triggerNotification = useCallback((type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);
 
  const loadModerationData = useCallback(async () => {
    try {
      setFetchLoading(true);
      
      // Fetch reported posts
      const postsList = await queryDocuments("posts", where("isReported", "==", true)) as ReportedPost[];
      postsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReportedPosts(postsList);
 
      // Fetch reported replies
      const repliesList = await queryDocuments("replies", where("isReported", "==", true)) as ReportedReply[];
      repliesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReportedReplies(repliesList);
 
    } catch (err) {
      console.error("Error loading reported content:", err);
      triggerNotification("error", "Failed to fetch reported content registry.");
    } finally {
      setFetchLoading(false);
    }
  }, [triggerNotification]);
 
  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      if (user && user.role === "admin") {
        loadModerationData();
      }
    };
    run();
  }, [user, loadModerationData]);

  // Approve reported post (keep in forum, set isReported: false)
  const handleApprovePost = async (postId: string, title: string) => {
    if (!user) return;
    try {
      await updateDocument("posts", postId, { isReported: false });
      
      // Write Audit Log
      await addDocument("audit_logs", {
        adminId: user.uid,
        adminEmail: user.email,
        action: "ADMIN_APPROVED_POST",
        details: `Admin approved post: "${title}" (ID: ${postId})`,
        timestamp: new Date().toISOString()
      });

      triggerNotification("success", "Post approved and removed from moderation queue.");
      setReportedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error("Error approving post:", err);
      triggerNotification("error", "Failed to approve post.");
    }
  };

  // Delete reported post (remove entirely)
  const handleDeletePost = async (postId: string, title: string) => {
    if (!user) return;
    try {
      await deleteDocument("posts", postId);
      
      // Write Audit Log
      await addDocument("audit_logs", {
        adminId: user.uid,
        adminEmail: user.email,
        action: "ADMIN_DELETED_POST",
        details: `Admin deleted post: "${title}" (ID: ${postId})`,
        timestamp: new Date().toISOString()
      });

      // Query and delete associated replies if any
      const repliesList = await queryDocuments("replies", where("postId", "==", postId)) as ReportedReply[];
      for (const rep of repliesList) {
        await deleteDocument("replies", rep.id);
      }

      triggerNotification("success", "Post and associated replies deleted permanently.");
      setReportedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
      triggerNotification("error", "Failed to delete post.");
    }
  };

  // Approve reported reply (keep in forum, set isReported: false)
  const handleApproveReply = async (replyId: string, postId: string) => {
    if (!user) return;
    try {
      await updateDocument("replies", replyId, { isReported: false });
      
      // Write Audit Log
      await addDocument("audit_logs", {
        adminId: user.uid,
        adminEmail: user.email,
        action: "ADMIN_APPROVED_REPLY",
        details: `Admin approved reply ID: ${replyId} on post: ${postId}`,
        timestamp: new Date().toISOString()
      });

      triggerNotification("success", "Response approved and cleared from moderation queue.");
      setReportedReplies(prev => prev.filter(r => r.id !== replyId));
    } catch (err) {
      console.error("Error approving reply:", err);
      triggerNotification("error", "Failed to approve response.");
    }
  };

  // Delete reported reply
  const handleDeleteReply = async (replyId: string, postId: string) => {
    if (!user) return;
    try {
      await deleteDocument("replies", replyId);
      
      // Write Audit Log
      await addDocument("audit_logs", {
        adminId: user.uid,
        adminEmail: user.email,
        action: "ADMIN_DELETED_REPLY",
        details: `Admin deleted reply ID: ${replyId} on post: ${postId}`,
        timestamp: new Date().toISOString()
      });

      triggerNotification("success", "Response deleted permanently.");
      setReportedReplies(prev => prev.filter(r => r.id !== replyId));
    } catch (err) {
      console.error("Error deleting reply:", err);
      triggerNotification("error", "Failed to delete response.");
    }
  };

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-portal-bg text-portal-text-primary">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 border-4 border-portal-primary border-t-transparent rounded-full animate-spin mx-auto text-portal-primary" />
          <p className="text-portal-text-secondary text-sm tracking-wide">Checking administrative clearance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in text-portal-text-primary font-sans relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-24 right-8 p-4 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 z-50 animate-bounce ${
          notification.type === "success" ? "bg-emerald-950 border border-emerald-500/30 text-emerald-400" : "bg-red-950 border border-red-500/30 text-red-400"
        }`}>
          <AlertTriangle className="w-4 h-4" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-portal-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-portal-text-primary tracking-tight">Forum Moderation Desk</h1>
          <p className="text-sm text-portal-text-secondary mt-1">
            Audit posts and replies flagged by the learning community. Maintain a professional, safe consulting workspace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1 bg-slate-50 border border-portal-border rounded-full text-xs font-bold text-portal-primary uppercase tracking-wider">
            Moderator Console
          </span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-100">
        {[
          { id: "posts" as const, label: `Flagged Threads (${reportedPosts.length})` },
          { id: "replies" as const, label: `Flagged Responses (${reportedReplies.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "border-portal-primary text-portal-primary"
                : "border-transparent text-portal-text-secondary hover:text-portal-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Moderation Desk Content */}
      {fetchLoading ? (
        <div className="p-20 text-center bg-white border border-portal-border rounded-3xl">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-portal-primary mb-2" />
          <p className="text-xs text-portal-text-secondary">Retrieving flagged database entries...</p>
        </div>
      ) : activeTab === "posts" ? (
        
        /* reported posts workspace */
        reportedPosts.length === 0 ? (
          <div className="p-16 text-center bg-white border border-portal-border rounded-3xl space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <div>
              <p className="font-bold text-portal-text-primary">Post Moderation Queue Clear</p>
              <p className="text-xs text-portal-text-secondary mt-1">No community posts have been flagged for review.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {reportedPosts.map((post) => (
              <div key={post.id} className="p-5 rounded-2xl bg-white border border-red-500/25 flex flex-col md:flex-row justify-between gap-6 shadow-md hover:border-red-500/40 transition-colors">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold uppercase tracking-wider">
                      Flagged Thread
                    </span>
                    <span className="text-slate-500">Author:</span>
                    <span className="font-bold text-portal-text-secondary">{post.authorName} ({post.authorRole})</span>
                    <span className="text-slate-500">&bull;</span>
                    <span className="text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-md font-bold text-portal-text-primary">{post.title}</h3>
                  <p className="text-xs text-portal-text-secondary leading-relaxed bg-slate-50/30 p-3.5 rounded-xl border border-portal-border">{post.content}</p>
                </div>

                {/* Moderation Controls */}
                <div className="flex sm:flex-col justify-end gap-2 md:w-44 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0 self-stretch md:self-center">
                  <button
                    onClick={() => handleApprovePost(post.id, post.title)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-portal-text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id, post.title)}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-portal-text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Post</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )

      ) : (
        
        /* reported replies workspace */
        reportedReplies.length === 0 ? (
          <div className="p-16 text-center bg-white border border-portal-border rounded-3xl space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <div>
              <p className="font-bold text-portal-text-primary">Response Moderation Queue Clear</p>
              <p className="text-xs text-portal-text-secondary mt-1">No replies or comments have been flagged for review.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {reportedReplies.map((reply) => (
              <div key={reply.id} className="p-5 rounded-2xl bg-white border border-red-500/25 flex flex-col md:flex-row justify-between gap-6 shadow-md hover:border-red-500/40 transition-colors">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold uppercase tracking-wider">
                      Flagged Reply
                    </span>
                    <span className="text-slate-500">Author:</span>
                    <span className="font-bold text-portal-text-secondary">{reply.authorName} ({reply.authorRole})</span>
                    <span className="text-slate-500">&bull;</span>
                    <span className="text-slate-400">Post ID: {reply.postId}</span>
                  </div>

                  <p className="text-xs text-portal-text-secondary leading-relaxed bg-slate-50/30 p-3.5 rounded-xl border border-portal-border">{reply.content}</p>
                </div>

                {/* Moderation Controls */}
                <div className="flex sm:flex-col justify-end gap-2 md:w-44 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0 self-stretch md:self-center">
                  <button
                    onClick={() => handleApproveReply(reply.id, reply.postId)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-portal-text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleDeleteReply(reply.id, reply.postId)}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-portal-text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Reply</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
}
