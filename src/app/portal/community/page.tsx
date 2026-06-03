"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { queryDocuments, addDocument, updateDocument, getDocument } from "@/lib/services/firestoreService";
import {
  MessageSquare,
  Send,
  Plus,
  Loader2,
  Sparkles,
  ArrowRight,
  Hash,
  MessageCircle,
  ThumbsUp,
  Filter,
  AlertTriangle,
  Flag,
  BookOpen
} from "lucide-react";
import { where } from "firebase/firestore";

interface Post {
  id: string;
  title: string;
  content: string;
  channel: string;
  courseId?: string; // Optional course link
  courseTitle?: string;
  userId: string;
  authorName: string;
  authorRole: string;
  likes: number;
  likedBy?: string[];
  isReported?: boolean;
  createdAt: string;
}

interface Reply {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorRole: string;
  content: string;
  isReported?: boolean;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
}

const CHANNELS = [
  { id: "general", label: "General Discussions", desc: "General learning queries and operations talk." },
  { id: "lean-six-sigma", label: "Lean Six Sigma", desc: "DMAIC, process capability, and quality control." },
  { id: "industry-4.0", label: "Industry 4.0", desc: "IoT integration, automation, and digital factory." },
  { id: "careers", label: "Careers & Networking", desc: "Consulting job boards and resume reviews." }
];

export default function CommunityPage() {
  const { user } = useAuth();

  // Posts list & UI state
  const [posts, setPosts] = useState<Post[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // Navigation / Filter states
  const [activeChannel, setActiveChannel] = useState("general");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");

  // Thread composition form
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCourseId, setNewPostCourseId] = useState("");
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Active reply target
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({}); // Key: postId, Value: replies list
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Alert/Toast states
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch course list for filtering and link selectors
  useEffect(() => {
    async function loadCourses() {
      try {
        const list = await queryDocuments("courses") as Course[];
        setCourses(list);
      } catch (err) {
        console.error("Error loading courses for forum:", err);
      }
    }
    const run = async () => {
      await Promise.resolve();
      if (user) {
        loadCourses();
      }
    };
    run();
  }, [user]);

  // Fetch threads
  const fetchChannelThreads = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingPosts(true);
      
      const constraints = [where("channel", "==", activeChannel)];
      if (selectedCourseId !== "all") {
        constraints.push(where("courseId", "==", selectedCourseId));
      }

      const list = await queryDocuments("posts", ...constraints) as Post[];
      // Filter out deleted posts or let admin handle them
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPosts(list);
    } catch (err) {
      console.error("Error loading community posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  }, [user, activeChannel, selectedCourseId]);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      fetchChannelThreads();
    };
    run();
  }, [fetchChannelThreads]);

  // Fetch replies for a specific post
  const loadRepliesForPost = useCallback(async (postId: string) => {
    try {
      setLoadingReplies(prev => ({ ...prev, [postId]: true }));
      const list = await queryDocuments("replies", where("postId", "==", postId)) as Reply[];
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setReplies(prev => ({ ...prev, [postId]: list }));
    } catch (err) {
      console.error("Error loading replies:", err);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [postId]: false }));
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      if (selectedPostId) {
        loadRepliesForPost(selectedPostId);
      }
    };
    run();
  }, [selectedPostId, loadRepliesForPost]);

  if (!user) return null;

  // Create new thread
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    setSubmittingPost(true);

    const linkedCourse = courses.find(c => c.id === newPostCourseId);
    const postData: any = {
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      channel: activeChannel,
      userId: user.uid,
      authorName: user.fullName,
      authorRole: user.role,
      likes: 0,
      likedBy: [],
      isReported: false,
      createdAt: new Date().toISOString()
    };

    if (newPostCourseId) {
      postData.courseId = newPostCourseId;
      postData.courseTitle = linkedCourse?.title || "";
    }

    try {
      await addDocument("posts", postData);
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostCourseId("");
      setIsCreatingPost(false);
      triggerToast("Discussion thread published successfully!");
      fetchChannelThreads();
    } catch (err) {
      console.error("Error creating post:", err);
      triggerToast("Failed to publish thread.");
    } finally {
      setSubmittingPost(false);
    }
  };

  // Submit reply to a post
  const handleSendReply = async (postId: string) => {
    if (!replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      await addDocument("replies", {
        postId,
        userId: user.uid,
        authorName: user.fullName,
        authorRole: user.role,
        content: replyContent.trim(),
        isReported: false,
        createdAt: new Date().toISOString()
      });

      setReplyContent("");
      triggerToast("Response published!");
      loadRepliesForPost(postId);
    } catch (err) {
      console.error("Error saving reply:", err);
      triggerToast("Failed to send response.");
    } finally {
      setSubmittingReply(false);
    }
  };

  // Like a post
  const handleLikePost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const likedBy = post.likedBy || [];
      const hasLiked = likedBy.includes(user.uid);
      
      let newLikedBy = [];
      let newLikesCount = post.likes;

      if (hasLiked) {
        newLikedBy = likedBy.filter(uid => uid !== user.uid);
        newLikesCount = Math.max(0, newLikesCount - 1);
      } else {
        newLikedBy = [...likedBy, user.uid];
        newLikesCount += 1;
      }

      await updateDocument("posts", postId, {
        likes: newLikesCount,
        likedBy: newLikedBy
      });

      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikesCount, likedBy: newLikedBy } : p));
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  // Flag/Report Post
  const handleReportPost = async (postId: string) => {
    try {
      await updateDocument("posts", postId, { isReported: true });
      triggerToast("Post flagged for administrator review.");
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isReported: true } : p));
    } catch (err) {
      console.error("Error reporting post:", err);
    }
  };

  // Flag/Report Reply
  const handleReportReply = async (postId: string, replyId: string) => {
    try {
      await updateDocument("replies", replyId, { isReported: true });
      triggerToast("Response flagged for administrator review.");
      setReplies(prev => ({
        ...prev,
        [postId]: prev[postId].map(r => r.id === replyId ? { ...r, isReported: true } : r)
      }));
    } catch (err) {
      console.error("Error reporting reply:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 right-8 p-4 rounded-xl bg-slate-900 border border-brand-orange/30 shadow-2xl text-xs text-brand-orange font-bold flex items-center gap-2 z-50 animate-bounce">
          <AlertTriangle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-portal-border/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-portal-primary" />
            <span>Community Forum</span>
          </h1>
          <p className="text-sm text-portal-text-secondary mt-1">Network with engineering executives, consult on Lean projects, and solve syllabus challenges.</p>
        </div>

        <button
          onClick={() => setIsCreatingPost(true)}
          className="px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>New Discussion Thread</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Channels & Course Filters */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Channels Filter */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-portal-text-secondary flex items-center gap-1.5 px-1">
              <Filter className="w-4 h-4 text-portal-primary" />
              <span>Channels</span>
            </h3>

            <div className="bg-portal-card border border-portal-border/60 rounded-2xl overflow-hidden p-2.5 space-y-1 shadow-sm">
              {CHANNELS.map((ch) => {
                const isActive = activeChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChannel(ch.id);
                      setIsCreatingPost(false);
                      setSelectedPostId(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl flex flex-col transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-900 border border-portal-primary/45 text-white"
                        : "hover:bg-slate-900/40 border border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="font-extrabold text-xs flex items-center gap-1">
                      <Hash className={`w-3.5 h-3.5 ${isActive ? "text-portal-primary" : "text-slate-600"}`} />
                      {ch.label}
                    </span>
                    <span className="text-[10px] text-portal-text-secondary mt-1 line-clamp-1">{ch.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Syllabus Linked Filter */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-portal-text-secondary flex items-center gap-1.5 px-1">
              <BookOpen className="w-4 h-4 text-portal-secondary" />
              <span>Course Linked Threads</span>
            </h3>

            <div className="bg-portal-card border border-portal-border/60 rounded-2xl p-4 shadow-sm">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Filter by Syllabus</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-secondary text-xs cursor-pointer"
              >
                <option value="all">All Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Middle/Right Columns: Threads list or Form */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-portal-text-secondary">
              Channel: <span className="text-portal-secondary font-extrabold">#{activeChannel}</span>
            </span>
            <span className="text-xs font-semibold text-portal-text-secondary">
              {posts.length} Active Threads
            </span>
          </div>

          {/* New Post Form */}
          {isCreatingPost && (
            <form
              onSubmit={handlePublishPost}
              className="bg-portal-card border border-portal-border/70 p-6 rounded-2xl space-y-4 shadow-xl"
            >
              <h3 className="font-bold text-white text-md flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-portal-warning" />
                <span>Publish Thread in #{activeChannel}</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Topic Headline *</label>
                  <input
                    type="text"
                    required
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="e.g. Lean manufacturing optimization on smart factory floor"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Link to Syllabus Course (Optional)</label>
                    <select
                      value={newPostCourseId}
                      onChange={(e) => setNewPostCourseId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-xs"
                    >
                      <option value="">No Course Link</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-portal-text-secondary uppercase mb-1.5">Discussion Content *</label>
                  <textarea
                    required
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={4}
                    placeholder="Provide details, code blocks, process specs, or recruitment metrics..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-portal-border/60 text-white focus:outline-none focus:border-portal-primary text-xs resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingPost(false)}
                  className="px-4 py-2 rounded-xl border border-portal-border hover:bg-slate-900 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPost}
                  className="px-5 py-2 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingPost && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Thread</span>
                </button>
              </div>
            </form>
          )}

          {/* Posts Threads List */}
          {loadingPosts ? (
            <div className="bg-portal-card border border-portal-border/60 p-16 rounded-2xl text-center text-portal-text-secondary shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-portal-primary mb-3" />
              <span>Querying channel discussion boards...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-portal-card border border-portal-border/60 p-16 rounded-2xl text-center space-y-4 shadow-sm">
              <MessageCircle className="w-12 h-12 text-slate-700 mx-auto" />
              <div>
                <p className="font-bold text-white text-md">Channel Board is Clear</p>
                <p className="text-xs text-portal-text-secondary mt-1">No active queries found here. Be the first to start a discussion thread!</p>
              </div>
              <button
                onClick={() => setIsCreatingPost(true)}
                className="inline-flex px-5 py-2.5 rounded-xl bg-slate-900 border border-portal-border text-xs font-bold text-portal-primary hover:bg-portal-primary hover:text-white transition-all cursor-pointer shadow-sm"
              >
                Start Topic
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const isSelected = selectedPostId === post.id;
                const authorBadge =
                  post.authorRole === "admin" ? "text-portal-primary bg-portal-primary/10 border-portal-primary/20" :
                  post.authorRole === "paid" ? "text-portal-secondary bg-portal-secondary/10 border-portal-secondary/20" :
                  "text-portal-success bg-portal-success/10 border-portal-success/20";

                const hasLiked = post.likedBy?.includes(user.uid);
                const postReplies = replies[post.id] || [];
                const postRepliesLoading = loadingReplies[post.id];

                return (
                  <div
                    key={post.id}
                    className="bg-portal-card border border-portal-border/60 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm hover:border-slate-800 transition-colors relative"
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-200">
                          <div className="w-6 h-6 rounded-full bg-slate-950 border border-portal-border/80 flex items-center justify-center text-[10px] text-white">
                            {post.authorName.charAt(0).toUpperCase()}
                          </div>
                          <span>{post.authorName}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${authorBadge}`}>
                          {post.authorRole}
                        </span>
                        
                        {/* Course link indicator */}
                        {post.courseTitle && (
                          <span className="text-[9px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full text-portal-secondary font-bold truncate max-w-[150px]" title={post.courseTitle}>
                            Course: {post.courseTitle}
                          </span>
                        )}

                        <span className="text-[9px] text-portal-text-secondary ml-auto">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-md sm:text-lg font-extrabold text-white leading-snug">{post.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-portal-border/30 text-xs">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center gap-1.5 font-bold cursor-pointer transition-all hover:scale-105 ${
                            hasLiked ? "text-portal-primary" : "text-portal-text-secondary hover:text-slate-200"
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>{post.likes} Likes</span>
                        </button>

                        <button
                          onClick={() => setSelectedPostId(isSelected ? null : post.id)}
                          className={`flex items-center gap-1.5 font-bold cursor-pointer transition-all hover:scale-105 ${
                            isSelected ? "text-portal-secondary" : "text-portal-text-secondary hover:text-slate-200"
                          }`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Replies</span>
                        </button>
                      </div>

                      {/* Report / Flag button */}
                      <button
                        onClick={() => handleReportPost(post.id)}
                        disabled={post.isReported}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
                          post.isReported 
                            ? "bg-red-500/10 border-red-500/25 text-red-400" 
                            : "bg-slate-900 border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-500/20 cursor-pointer"
                        }`}
                        title="Report Content"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold">{post.isReported ? "Flagged" : "Report"}</span>
                      </button>
                    </div>

                    {/* Replies Thread */}
                    {isSelected && (
                      <div className="space-y-4 pt-4 border-t border-portal-border/30 bg-slate-950/20 p-4.5 rounded-2xl border border-portal-border/40 animate-slide-down">
                        <h5 className="text-[10px] font-bold text-portal-text-secondary uppercase tracking-wider">Responses</h5>

                        {postRepliesLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-portal-primary" />
                          </div>
                        ) : postReplies.length === 0 ? (
                          <p className="text-xs text-portal-text-secondary italic">No replies yet. Share your experience.</p>
                        ) : (
                          <div className="space-y-3">
                            {postReplies.map((rep) => {
                              const repBadge =
                                rep.authorRole === "admin" ? "text-portal-primary bg-portal-primary/10 border-portal-primary/20" :
                                rep.authorRole === "paid" ? "text-portal-secondary bg-portal-secondary/10 border-portal-secondary/20" :
                                "text-portal-success bg-portal-success/10 border-portal-success/20";
                              return (
                                <div key={rep.id} className="p-3 bg-slate-950/40 border border-portal-border/45 rounded-xl space-y-1.5">
                                  <div className="flex items-center gap-2 text-[10px]">
                                    <span className="font-bold text-slate-200">{rep.authorName}</span>
                                    <span className={`px-1.5 py-0.2 rounded text-[7px] font-bold uppercase tracking-wider border ${repBadge}`}>
                                      {rep.authorRole}
                                    </span>
                                    <span className="text-[9px] text-portal-text-secondary">
                                      {new Date(rep.createdAt).toLocaleDateString()}
                                    </span>

                                    {/* Report reply button */}
                                    <button
                                      onClick={() => handleReportReply(post.id, rep.id)}
                                      disabled={rep.isReported}
                                      className={`ml-auto flex items-center gap-0.5 px-2 py-0.5 rounded border transition-all ${
                                        rep.isReported 
                                          ? "bg-red-500/10 border-red-500/20 text-red-400" 
                                          : "bg-slate-900 border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-500/20 cursor-pointer"
                                      }`}
                                    >
                                      <Flag className="w-3 h-3" />
                                      <span className="text-[8px] font-bold">{rep.isReported ? "Flagged" : "Report"}</span>
                                    </button>
                                  </div>
                                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{rep.content}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Compose reply input */}
                        <div className="flex gap-2 items-center mt-2.5">
                          <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Add your expert comment..."
                            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-955 border border-portal-border/60 text-white placeholder-portal-text-secondary focus:outline-none focus:border-portal-primary text-xs"
                          />
                          <button
                            onClick={() => handleSendReply(post.id)}
                            disabled={submittingReply || !replyContent.trim()}
                            className="p-2 py-2 rounded-xl bg-portal-primary hover:bg-portal-primary/95 text-white cursor-pointer transition-all flex items-center justify-center disabled:opacity-50"
                          >
                            {submittingReply ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
