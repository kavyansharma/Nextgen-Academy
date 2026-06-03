"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments, setDocument, addDocument } from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";
import {
  MessageSquare,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  Inbox,
  Filter,
  Search,
  CheckCircle,
  PlaySquare,
  CheckCircle2,
  FolderOpen
} from "lucide-react";

interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  updatedAt: string;
}

interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: "user" | "admin";
  message: string;
  createdAt: string;
}

export default function AdminSupportDeskPage() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();

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

  // Data states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Selection states
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch all tickets
  const fetchAllTickets = useCallback(async () => {
    try {
      setLoadingTickets(true);
      const list = await queryDocuments("support_tickets") as Ticket[];
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setTickets(list);
    } catch (err) {
      console.error("Error fetching admin tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      if (user && user.role === "admin") {
        fetchAllTickets();
      }
    };
    run();
  }, [user, fetchAllTickets]);

  // Fetch messages for selected ticket
  const fetchMessages = useCallback(async (ticketId: string) => {
    try {
      setLoadingMessages(true);
      const list = await queryDocuments(
        "ticket_messages",
        where("ticketId", "==", ticketId)
      ) as TicketMessage[];
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(list);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      if (selectedTicket) {
        fetchMessages(selectedTicket.id);
      }
    };
    run();
  }, [selectedTicket, fetchMessages]);

  // Admin status update
  const handleStatusChange = async (newStatus: "open" | "in_progress" | "resolved") => {
    if (!user || !selectedTicket || updatingStatus) return;
    setUpdatingStatus(true);
    const now = new Date().toISOString();

    try {
      // 1. Update ticket doc status
      await setDocument("support_tickets", selectedTicket.id, {
        status: newStatus,
        updatedAt: now
      });

      // 2. Add system notification inside ticket messages
      await addDocument("ticket_messages", {
        ticketId: selectedTicket.id,
        senderId: "SYSTEM",
        senderName: "Helpdesk System",
        senderRole: "admin",
        message: `[System Status Change] Ticket marked as: ${newStatus.toUpperCase()}`,
        createdAt: now
      });

      // 3. Write Admin Audit Log
      await addDocument("audit_logs", {
        adminId: user.uid,
        adminEmail: user.email,
        action: "ADMIN_UPDATED_TICKET_STATUS",
        details: `Admin changed status of ticket ${selectedTicket.id} to: ${newStatus}`,
        timestamp: now
      });

      // 4. In-app notification to student
      await addDocument("notifications", {
        userId: selectedTicket.userId,
        title: "Support Ticket Updated",
        message: `Your ticket "${selectedTicket.subject}" status changed to: ${newStatus.toUpperCase()}`,
        type: "support",
        read: false,
        createdAt: now
      });

      setSelectedTicket(prev => prev ? { ...prev, status: newStatus, updatedAt: now } : null);
      await fetchMessages(selectedTicket.id);
      await fetchAllTickets();
    } catch (err) {
      console.error("Error updating ticket status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Admin reply submission
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !replyText.trim() || isSendingReply) return;

    setIsSendingReply(true);
    const now = new Date().toISOString();

    try {
      // 1. Add message doc
      await addDocument("ticket_messages", {
        ticketId: selectedTicket.id,
        senderId: user.uid,
        senderName: user.fullName,
        senderRole: "admin",
        message: replyText.trim(),
        createdAt: now
      });

      // 2. Set ticket status to in_progress upon reply
      const targetStatus = selectedTicket.status === "open" ? "in_progress" : selectedTicket.status;
      await setDocument("support_tickets", selectedTicket.id, {
        status: targetStatus,
        updatedAt: now
      });

      // 3. Write Admin Audit Log
      await addDocument("audit_logs", {
        adminId: user.uid,
        adminEmail: user.email,
        action: "ADMIN_REPLIED_TO_TICKET",
        details: `Admin replied to ticket ${selectedTicket.id}`,
        timestamp: now
      });

      // 4. In-app notification to student
      await addDocument("notifications", {
        userId: selectedTicket.userId,
        title: "New Support Message",
        message: `Support team replied to your ticket: "${selectedTicket.subject}"`,
        type: "support",
        read: false,
        createdAt: now
      });

      // 5. Send automated notification email via server-side endpoint
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          await fetch("/api/support/send-reply", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`
            },
            body: JSON.stringify({
              userEmail: selectedTicket.userEmail,
              userName: selectedTicket.userName,
              ticketId: selectedTicket.id,
              ticketSubject: selectedTicket.subject,
              replyText: replyText.trim()
            })
          });
        } catch (err) {
          console.error("Resend email dispatch error on support reply:", err);
        }
      }

      setReplyText("");
      setSelectedTicket(prev => prev ? { ...prev, status: targetStatus, updatedAt: now } : null);
      await fetchMessages(selectedTicket.id);
      await fetchAllTickets();
    } catch (err) {
      console.error("Error submitting admin reply:", err);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Filtering tickets
  const filteredTickets = tickets.filter(t => {
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-portal-bg text-portal-text-primary">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 border-4 border-portal-primary border-t-transparent rounded-full animate-spin mx-auto text-portal-primary" />
          <p className="text-portal-text-secondary text-sm tracking-wide">Validating administrator roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-100 font-sans">
      
      {/* Header */}
      <div className="border-b border-portal-border/60 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Support Desk</h1>
          <p className="text-sm text-portal-text-secondary mt-1">
            Review, reply, filter, and track resolving states for all LMS student support queries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-portal-primary">
            Admin View
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Tickets List (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by ID, name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-portal-border/60 text-white placeholder-slate-600 focus:outline-none focus:border-portal-primary text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 border border-portal-border/50 rounded-xl px-3 py-2">
                <Filter className="w-3.5 h-3.5 text-portal-primary" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent border-0 text-white text-xs font-semibold focus:outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* List panel */}
            <div className="p-5 rounded-2xl bg-portal-card border border-portal-border/60 shadow-sm min-h-[400px]">
              {loadingTickets ? (
                <div className="py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-portal-primary" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <Inbox className="w-10 h-10 text-slate-700 mx-auto" />
                  <p className="text-xs text-portal-text-secondary">No queries match filters.</p>
                </div>
              ) : (
                <div className="space-y-3 divide-y divide-portal-border/20">
                  {filteredTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`pt-3 first:pt-0 flex justify-between items-center gap-4 p-2.5 rounded-xl transition-all cursor-pointer ${
                        selectedTicket?.id === t.id ? "bg-slate-900 border border-portal-primary/30" : "hover:bg-slate-900/30 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-slate-500 font-bold">{t.id}</span>
                          <span className="text-[8px] font-semibold text-slate-400 truncate max-w-[120px]">{t.userName}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[200px]" title={t.subject}>
                          {t.subject}
                        </h4>
                        <span className="text-[9px] text-slate-600 block mt-0.5">
                          Updated {new Date(t.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        t.status === "open" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        t.status === "in_progress" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Chat Desk (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-portal-text-secondary">Message Operations Desk</h3>

          {selectedTicket ? (
            <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/80 flex flex-col h-[520px] justify-between shadow-xl">
              
              {/* Ticket Top bar */}
              <div className="border-b border-portal-border/40 pb-4 mb-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 font-bold">{selectedTicket.id} &bull; {selectedTicket.userEmail}</span>
                    <h2 className="text-md font-bold text-white">{selectedTicket.subject}</h2>
                    <p className="text-[10px] text-slate-400">Created by: <strong>{selectedTicket.userName}</strong> on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                  </div>
                  
                  {/* Status update buttons */}
                  <div className="flex gap-1.5">
                    {(["open", "in_progress", "resolved"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={updatingStatus || selectedTicket.status === status}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all border ${
                          selectedTicket.status === status
                            ? status === "open" ? "bg-red-500/20 border-red-500/40 text-red-400" :
                              status === "in_progress" ? "bg-amber-500/20 border-amber-500/40 text-amber-400" :
                              "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                        }`}
                      >
                        {status.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-portal-primary" />
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isSystem = msg.senderId === "SYSTEM";
                    const isUser = msg.senderRole === "user";
                    
                    if (isSystem) {
                      return (
                        <div key={idx} className="flex justify-center my-2">
                          <span className="px-3 py-1 bg-slate-950 border border-slate-850 rounded-lg text-[9px] text-slate-500 font-medium">
                            {msg.message}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}>
                        <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                          isUser
                            ? "bg-slate-800 border border-slate-750 text-slate-200 rounded-tl-none"
                            : "bg-brand-orange/15 border border-brand-orange/20 text-slate-100 rounded-tr-none"
                        }`}>
                          <p className="text-[9px] font-bold text-slate-400 mb-0.5">
                            {msg.senderName} ({msg.senderRole})
                          </p>
                          <p>{msg.message}</p>
                        </div>
                        <span className="text-[8px] text-slate-600 mt-0.5">
                          {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleReplySubmit} className="flex gap-2 items-center border-t border-portal-border/30 pt-4">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type an official support resolution reply message..."
                  required
                  disabled={isSendingReply}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white placeholder-slate-650 focus:outline-none focus:border-portal-primary text-xs"
                />
                <button
                  type="submit"
                  disabled={isSendingReply || !replyText.trim()}
                  className="p-3 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white transition-colors cursor-pointer disabled:opacity-30 flex items-center justify-center"
                >
                  {isSendingReply ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>

            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 flex flex-col justify-center items-center text-center h-[520px] space-y-4">
              <Inbox className="w-12 h-12 text-slate-700 animate-bounce" />
              <div>
                <h4 className="font-bold text-white">No Ticket Selected</h4>
                <p className="text-xs text-portal-text-secondary mt-1 max-w-sm">
                  Select a support query from the left pane to read conversations, reply to students, or adjust statuses.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
