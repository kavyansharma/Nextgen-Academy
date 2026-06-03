"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { signIn } from "@/lib/services/authService";
import { queryDocuments } from "@/lib/services/firestoreService";
import { where } from "firebase/firestore";
import { LogIn, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Form states
  const [identifier, setIdentifier] = useState(""); // Email or Username
  const [password, setPassword] = useState("");

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

    // Basic validation
    if (!identifier.trim() || !password) {
      setFormError("All fields are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      let resolvedEmail = identifier.trim();

      // Check if identifier is an email (contains @) or username
      if (!resolvedEmail.includes("@")) {
        const cleanUsername = resolvedEmail.toLowerCase();
        
        // Query users by username
        const usersFound = await queryDocuments(
          "users",
          where("username", "==", cleanUsername)
        );

        if (usersFound.length === 0) {
          setFormError("No account found with this username.");
          setIsSubmitting(false);
          return;
        }

        resolvedEmail = usersFound[0].email;
      }

      // Log in with resolved email and password
      await signIn(resolvedEmail.toLowerCase(), password);
      
      setSuccess(true);
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push("/portal/dashboard");
      }, 1000);

    } catch (err: any) {
      console.error("Login Error:", err);
      // Map common Firebase auth errors to user friendly errors
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setFormError("Incorrect email/username or password.");
      } else if (err.code === "auth/invalid-email") {
        setFormError("Please enter a valid email address.");
      } else {
        setFormError(err.message || "An error occurred during login. Please try again.");
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
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Portal Sign In</h2>
          <p className="text-sm text-brand-text-muted">Enter your credentials to access the Portal</p>
        </div>

        {formError && (
          <div className="mb-6 flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm animate-fade-in">
            <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>Sign in successful! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Email or Username</label>
            <input
              type="text"
              placeholder="Username or email address"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isSubmitting || success}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Password</label>
              <Link href="/portal/forgot-password" className="text-xs font-semibold text-brand-blue hover:text-brand-blue-hover transition-colors duration-200">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-brand-text-muted border-t border-slate-800/80 pt-6">
          Don&apos;t have an account?{" "}
          <Link href="/portal/register" className="text-brand-blue hover:text-brand-blue-hover font-semibold transition-colors duration-200">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
}
