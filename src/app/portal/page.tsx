"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

export default function PortalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/portal/dashboard");
      } else {
        router.replace("/portal/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-brand-dark">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-brand-text-muted text-sm tracking-wide">Redirecting to NextGen Portal...</p>
      </div>
    </div>
  );
}
