"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments, setDocument, addDocument } from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";
import {
  Mail,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Clock,
  Send,
  Inbox
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

export default function SupportPage() {
  const { user } = useAuth();
  
  // Ticket list states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  
  // Form states
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Active ticket selection
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How do I download my course certificates?",
      a: "Certificates are automatically generated and claimed once a course is 100% completed. Go to the Certificates section in the left sidebar to view and download them."
    },
    {
      q: "What is the difference between Free and Premium accounts?",
      a: "Free accounts can access standard articles, resources, and free fundamentals courses. Paid/Admin accounts unlock advanced consulting playbooks, premium video courses, certification paths, and print-ready credentials."
    },
    {
      q: "How do I upgrade my user subscription status?",
      a: "To upgrade, try clicking any premium course card in the catalog and choose 'Upgrade Membership' inside the premium lock overlay. This will simulate a secure payment and immediately promote your profile role."
    },
    {
      q: "Who do I contact for custom corporate training programs?",
      a: "Please email our consulting directors directly at info@nextgen-consulting.com or submit a ticket here with details of your team sizing and training requirements."
    }
  ];

  // Fetch user tickets
  const fetchTickets = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingTickets(true);
      const list = await queryDocuments(
        "support_tickets",
        where("userId", "==", user.uid)
      ) as Ticket[];
      
      // Sort by updatedAt descending
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setTickets(list);
    } catch (err) {
      console.error("Error loading tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  }, [user]);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      fetchTickets();
    };
    run();
  }, [fetchTickets]);

  // Fetch messages for selected ticket
  const fetchMessages = useCallback(async (ticketId: string) => {
    try {
      setLoadingMessages(true);
      const list = await queryDocuments(
        "ticket_messages",
        where("ticketId", "==", ticketId)
      ) as TicketMessage[];
      
      // Sort by createdAt ascending
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(list);
    } catch (err) {
      console.error("Error loading ticket messages:", err);
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

  // Handle open ticket submission
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticketSubject.trim() || !ticketMessage.trim()) return;

    setIsSubmitting(true);
    const ticketId = `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    try {
      // 1. Create ticket document
      await setDocument("support_tickets", ticketId, {
        id: ticketId,
        userId: user.uid,
        userName: user.fullName,
        userEmail: user.email,
        subject: ticketSubject.trim(),
        status: "open",
        createdAt: now,
        updatedAt: now
      });

      // 2. Create first message
      await addDocument("ticket_messages", {
        ticketId,
        senderId: user.uid,
        senderName: user.fullName,
        senderRole: "user",
        message: ticketMessage.trim(),
        createdAt: now
      });

      // 3. Create Audit Log
      await addDocument("audit_logs", {
        adminId: "SYSTEM",
        adminEmail: user.email,
        action: "USER_OPENED_TICKET",
        details: `User opened ticket ${ticketId}: "${ticketSubject}"`,
        timestamp: now
      });

      setIsSubmitted(true);
      setTicketSubject("");
      setTicketMessage("");
      await fetchTickets();
      
      setTimeout(() => setIsSubmitted(false), 4000);
    } catch (err) {
      console.error("Error creating ticket:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !replyText.trim()) return;

    setIsSendingReply(true);
    const now = new Date().toISOString();

    try {
      // 1. Add message document
      await addDocument("ticket_messages", {
        ticketId: selectedTicket.id,
        senderId: user.uid,
        senderName: user.fullName,
        senderRole: "user",
        message: replyText.trim(),
        createdAt: now
      });

      // 2. Update ticket updatedAt and reopen if resolved/in_progress
      const newStatus = selectedTicket.status === "resolved" ? "open" : selectedTicket.status;
      await setDocument("support_tickets", selectedTicket.id, {
        status: newStatus,
        updatedAt: now
      });

      setReplyText("");
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus, updatedAt: now } : null);
      await fetchMessages(selectedTicket.id);
      await fetchTickets();
    } catch (err) {
      console.error("Error sending reply:", err);
    } finally {
      setIsSendingReply(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in text-slate-900 font-sans">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">Support Desk</h1>
        <p className="text-sm text-slate-500 mt-1">
          Resolve questions, open technical query tickets, or engage directly with plant advisories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: FAQs & Create Ticket Form (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* FAQ Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Frequently Answered Credentials</h3>
            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left p-4.5 flex justify-between items-center gap-4 text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="p-4.5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create Ticket Form */}
          <form onSubmit={handleTicketSubmit} className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-portal-primary" />
              <span>Submit A New Ticket</span>
            </h3>

            {isSubmitted && (
              <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-xl text-[10px] text-emerald-800 flex items-center gap-2 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>Ticket registered! Our tech administrators have been notified.</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. Premium checkout verification failed"
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-portal-primary focus:ring-1 focus:ring-portal-primary text-xs shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Details Message</label>
                <textarea
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  rows={4}
                  placeholder="Tell us what occurred, including steps, to help us assist you faster..."
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-portal-primary focus:ring-1 focus:ring-portal-primary text-xs resize-none shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Submit Ticket</span>
              )}
            </button>
          </form>

        </div>

        {/* Right Column: Ticket Lists & Chats (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Ticket Workspace</h3>
          
          <div className="grid grid-cols-1 gap-4">
            
            {/* Active Ticket Details Chat Desk */}
            {selectedTicket ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-250 flex flex-col h-[400px] justify-between shadow-sm relative">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">{selectedTicket.id}</span>
                    <h4 className="text-xs font-bold text-slate-900 truncate max-w-[180px]">{selectedTicket.subject}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      selectedTicket.status === "open" ? "bg-red-50 text-red-700 border border-red-200" :
                      selectedTicket.status === "in_progress" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-emerald-50 text-emerald-755 border border-emerald-200"
                    }`}>
                      {selectedTicket.status}
                    </span>
                    <button 
                      onClick={() => setSelectedTicket(null)} 
                      className="text-[10px] text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                </div>

                {/* Message display thread */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-portal-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-[10px] text-slate-400 pt-10">No replies in thread.</p>
                  ) : (
                    messages.map((msg, idx) => {
                      const isAdmin = msg.senderRole === "admin";
                      return (
                        <div key={idx} className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}>
                          <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                            isAdmin 
                              ? "bg-blue-50/70 border border-blue-150 text-slate-800 rounded-tl-none" 
                              : "bg-slate-100 border border-slate-200 text-slate-700 rounded-tr-none"
                          }`}>
                            <p className="text-[9px] font-bold text-slate-500 mb-0.5">
                              {msg.senderName} ({msg.senderRole})
                            </p>
                            <p>{msg.message}</p>
                          </div>
                          <span className="text-[8px] text-slate-400 mt-0.5">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleReplySubmit} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={selectedTicket.status === "resolved" ? "Ticket resolved. Send message to reopen..." : "Write a reply message..."}
                    required
                    disabled={isSendingReply}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-portal-primary focus:bg-white text-xs shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyText.trim()}
                    className="p-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white transition-colors cursor-pointer disabled:opacity-30"
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
              /* Ticket List desk */
              <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-sm min-h-[300px]">
                {loadingTickets ? (
                  <div className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-portal-primary" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <Inbox className="w-10 h-10 text-slate-350 mx-auto" />
                    <p className="text-xs text-slate-500">You haven&apos;t opened any support queries yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 divide-y divide-slate-150">
                    {tickets.map((t) => (
                      <div 
                        key={t.id} 
                        onClick={() => setSelectedTicket(t)}
                        className="pt-3 first:pt-0 flex justify-between items-center gap-4 hover:bg-slate-50 p-2 rounded-xl transition-all cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono text-slate-400 font-bold block">{t.id}</span>
                          <h4 className="text-xs font-bold text-slate-850 group-hover:text-portal-primary transition-colors truncate max-w-[200px]" title={t.subject}>
                            {t.subject}
                          </h4>
                          <span className="text-[9px] text-slate-400 block mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Updated {new Date(t.updatedAt).toLocaleDateString()}</span>
                          </span>
                        </div>
                        
                        <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                          t.status === "open" ? "bg-red-55 text-red-700 border border-red-200" :
                          t.status === "in_progress" ? "bg-amber-55 text-amber-700 border border-amber-200" :
                          "bg-emerald-55 text-emerald-755 border border-emerald-200"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>

      </div>

      {/* Extra contact links */}
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white border border-slate-200 rounded-xl text-portal-secondary shadow-sm">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Direct Enterprise Support</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Need immediate assistance? Reach our plant management coordinators.</p>
          </div>
        </div>
        <a
          href="mailto:support@nextgen-consulting.com"
          className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all shadow-sm"
        >
          support@nextgen-consulting.com
        </a>
      </div>
    </div>
  );
}
