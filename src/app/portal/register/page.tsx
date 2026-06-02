"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { signUp } from "@/lib/services/authService";
import { queryDocuments } from "@/lib/services/firestoreService";
import { where, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserPlus, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI/Error states
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/portal/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Basic validation
    if (!fullName.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
      setFormError("All fields are required.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(cleanUsername)) {
      setFormError("Username must be 3-20 characters long and contain only letters, numbers, and underscores.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Check username uniqueness
      const existingUsers = await queryDocuments(
        "users",
        where("username", "==", cleanUsername)
      );

      if (existingUsers.length > 0) {
        setFormError("This username is already taken. Please choose another.");
        setIsSubmitting(false);
        return;
      }

      // 3. Register user in Firebase Auth
      const firebaseUser = await signUp(email.trim().toLowerCase(), password);
      console.log("AUTH_SUCCESS");

      // 4. Save user details in Firestore
      console.log("FIRESTORE_WRITE_START");
      try {
        await setDoc(doc(db, "users", firebaseUser.uid), {
          uid: firebaseUser.uid,
          fullName: fullName.trim(),
          username: cleanUsername,
          email: email.trim().toLowerCase(),
          role: "free",
          createdAt: new Date().toISOString()
        });
        console.log("FIRESTORE_WRITE_SUCCESS");
      } catch (writeErr: any) {
        console.error("FIRESTORE_WRITE_ERROR", writeErr);
        throw writeErr;
      }

      setSuccess(true);
      
      // Wait a moment for UX before redirecting
      setTimeout(() => {
        router.push("/portal/dashboard");
      }, 1500);

    } catch (err: any) {
      console.error("Registration Error:", err);
      // Map common Firebase errors to user friendly errors
      if (err.code === "auth/email-already-in-use") {
        setFormError("This email address is already in use.");
      } else if (err.code === "auth/invalid-email") {
        setFormError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setFormError("Password must be at least 6 characters.");
      } else {
        setFormError(err.message || "An error occurred during registration. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-brand-dark">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-brand-text-muted text-sm tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-12 bg-brand-dark overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 border border-white/5 shadow-2xl rounded-3xl p-8 glass z-10 animate-fade-in">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 items-center justify-center text-brand-orange">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Create Account</h2>
          <p className="text-sm text-brand-text-muted">Join the NextGen Consulting & Academy Portal</p>
        </div>

        {formError && (
          <div className="mb-6 flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm animate-fade-in">
            <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm animate-fade-in animate-pulse">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>Registration successful! Redirecting to Dashboard...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Full Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSubmitting || success}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Username</label>
            <input
              type="text"
              placeholder="letters, numbers, or underscores (3-20 chars)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting || success}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Email Address</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || success}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Password</label>
            <input
              type="password"
              placeholder="min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || success}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Confirm Password</label>
            <input
              type="password"
              placeholder="repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting || success}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || success}
            className="w-full mt-2 py-3.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Register Now</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-brand-text-muted border-t border-slate-800/80 pt-6">
          Already have an account?{" "}
          <Link href="/portal/login" className="text-brand-blue hover:text-brand-blue-hover font-semibold transition-colors duration-200">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
