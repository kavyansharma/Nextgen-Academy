"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "firebase/auth";
import { onAuthStateChanged, signOut as fbSignOut } from "../services/authService";
import { getDocument } from "../services/firestoreService";

export interface UserProfile {
  uid: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (fbUser: User | null) => {
    if (!fbUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await getDocument("users", fbUser.uid);
      if (profile) {
        setUser({
          uid: fbUser.uid,
          fullName: profile.fullName || "",
          username: profile.username || "",
          email: profile.email || fbUser.email || "",
          role: profile.role || "free",
          createdAt: profile.createdAt || "",
        });
      } else {
        // Fallback if document doesn't exist yet
        setUser(null);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      await fetchUserProfile(fbUser);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await fbSignOut();
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await fetchUserProfile(firebaseUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
