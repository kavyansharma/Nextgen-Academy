"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { updateDocument } from "@/lib/services/firestoreService";
import { 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  X,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2
} from "lucide-react";

interface PurchaseCardProps {
  resourceId: string;
  resourceTitle: string;
  price: number;
}

export default function PurchaseCard({ resourceId, resourceTitle, price }: PurchaseCardProps) {
  const { user, refreshUser } = useAuth();
  
  // Checkout states
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("123");

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      // Simulate payment delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Update Firestore user document role to 'paid'
      await updateDocument("users", user.uid, {
        role: "paid"
      });

      // Refresh Auth context user data
      await refreshUser();
      
      setSuccess(true);
      
      // Close checkout automatically after success message shows
      setTimeout(() => {
        setShowCheckout(false);
        // Force router reload/refresh is handled in slug page by AuthContext refresh
      }, 1500);

    } catch (err: any) {
      console.error("Payment Simulation Error:", err);
      setErrorMsg("An error occurred during payment processing. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-slate-900/60 border border-white/5 shadow-2xl rounded-3xl p-8 glass space-y-6 text-center animate-fade-in relative overflow-hidden group">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-2xl group-hover:bg-brand-orange/20 transition-all duration-500"></div>

      <div className="space-y-4">
        {/* Lock indicator */}
        <div className="inline-flex w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 items-center justify-center text-amber-400">
          <Lock className="w-6 h-6 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            Premium Resource
          </span>
          <h2 className="text-2xl font-extrabold text-white pt-2">{resourceTitle}</h2>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            This premium guide contains CXO interview templates, industrial case studies, and advanced strategies. Upgrade to access it.
          </p>
        </div>
      </div>

      {/* Pricing display */}
      <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
        <span className="text-xs text-brand-text-muted font-medium">One-Time Payment</span>
        <div className="text-4xl font-extrabold text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          ${price.toFixed(2)}
        </div>
        <p className="text-xs text-brand-text-muted mt-2">Unlimited lifetime access & PDF download support.</p>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <button
          onClick={() => setShowCheckout(true)}
          className="w-full py-4 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Buy Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured by Razorpay. Includes 256-bit encryption.</span>
        </p>
      </div>

      {/* ========================================== */}
      {/* SIMULATED RAZORPAY CHECKOUT MODAL */}
      {/* ========================================== */}
      {showCheckout && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl glass space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-850 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-brand-orange" />
                  <span>Razorpay Payment Gateway</span>
                </h3>
                <p className="text-xs text-brand-text-muted mt-0.5">Demo Checkout Mode</p>
              </div>
              <button 
                onClick={() => {
                  if (!isProcessing && !success) setShowCheckout(false);
                }}
                disabled={isProcessing}
                className="p-1 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price overview summary */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-850 flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-200 truncate pr-4">{resourceTitle}</span>
              <span className="font-bold text-white text-right">${price.toFixed(2)}</span>
            </div>

            {/* Error alerts */}
            {errorMsg && (
              <div className="flex gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs animate-fade-in">
                <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success alert */}
            {success && (
              <div className="flex gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs animate-fade-in animate-pulse">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                <span>Payment successful! Elevating user tier...</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Card Number</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  disabled={isProcessing || success}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-850 text-white focus:outline-none focus:border-brand-orange text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Expiry Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    disabled={isProcessing || success}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-850 text-white focus:outline-none focus:border-brand-orange text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">CVV</label>
                  <input
                    type="password"
                    required
                    maxLength={3}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    disabled={isProcessing || success}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-850 text-white focus:outline-none focus:border-brand-orange text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing || success}
                className="w-full py-3.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-lg shadow-brand-orange/20"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Demo Payment...</span>
                  </>
                ) : success ? (
                  <span>Unlocked!</span>
                ) : (
                  <span>Complete Payment (${price.toFixed(2)})</span>
                )}
              </button>

              <div className="pt-2 text-center">
                <span className="text-[10px] text-slate-500 font-medium tracking-wide flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>This is a simulated Razorpay sandbox sandbox. No real money will be charged.</span>
                </span>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
