"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  queryDocuments,
  getDocument,
  setDocument,
  logAdminAction,
  deleteDocument
} from "@/lib/services/firestoreService";
import {
  Settings,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Server,
  RefreshCcw,
  Calendar,
  Trash2,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

interface GlobalSettings {
  maintenanceMode: boolean;
  registrationClosed: boolean;
  systemDiagnostics: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  adminEmail: string;
  details: string;
  timestamp: string;
}

export default function AdminSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Settings State
  const [settings, setSettings] = useState<GlobalSettings>({
    maintenanceMode: false,
    registrationClosed: false,
    systemDiagnostics: true
  });
  
  // Auditing States
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Access check
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/portal/login");
      } else if (user.role !== "admin") {
        router.replace("/portal/dashboard");
      }
    }
  }, [user, loading, router]);

  // Load Settings & Audit Trail
  const loadPlatformSettings = async () => {
    if (!user || user.role !== "admin") return;
    try {
      setLoadingData(true);
      
      // Get global settings (seeding if missing)
      const data = await getDocument("settings", "global") as GlobalSettings | null;
      if (data) {
        setSettings({
          maintenanceMode: !!data.maintenanceMode,
          registrationClosed: !!data.registrationClosed,
          systemDiagnostics: !!data.systemDiagnostics
        });
      } else {
        await setDocument("settings", "global", {
          maintenanceMode: false,
          registrationClosed: false,
          systemDiagnostics: true
        });
      }

      // Load all logs
      const logsList = await queryDocuments("audit_logs") as AuditLog[];
      logsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(logsList);

    } catch (err) {
      console.error("Error loading platform configuration:", err);
      showToast("error", "Failed to retrieve configuration settings.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadPlatformSettings();
  }, [user]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  if (!user || user.role !== "admin") return null;

  // Toggle handlers
  const handleToggle = (key: keyof GlobalSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDocument("settings", "global", settings);
      await logAdminAction(
        user.uid,
        user.email || "",
        "UPDATE_SETTINGS",
        `Updated platform configurations: Maintenance Mode: ${settings.maintenanceMode}, Registration Closed: ${settings.registrationClosed}, Diagnostics: ${settings.systemDiagnostics}`
      );
      showToast("success", "Global platform configurations updated!");
      // Reload logs to reflect action log
      const logsList = await queryDocuments("audit_logs") as AuditLog[];
      logsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(logsList);
    } catch (err) {
      console.error("Error saving global configurations:", err);
      showToast("error", "Failed to update platform settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Clear single log
  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this action log?")) return;
    try {
      await deleteDocument("audit_logs", logId);
      showToast("success", "Audit log deleted successfully.");
      setLogs(prev => prev.filter(l => l.id !== logId));
    } catch (err) {
      console.error("Error deleting log:", err);
      showToast("error", "Failed to delete log.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Back button */}
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
      <div className="border-b border-portal-border/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl flex items-center gap-2">
            <Settings className="w-8 h-8 text-portal-primary animate-spin-slow" />
            <span>Platform Settings</span>
          </h1>
          <p className="text-sm text-portal-text-secondary mt-1">Configure global LMS maintenance flags, lock public registrations, and inspect logs.</p>
        </div>

        <button
          onClick={loadPlatformSettings}
          className="px-4 py-2.5 rounded-xl border border-portal-border hover:border-slate-500 bg-slate-900 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Reload Settings</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex gap-3 p-4 rounded-xl text-sm border shadow-lg animate-fade-in ${
          toast.type === "success" 
            ? "bg-portal-success/10 border-portal-success/20 text-portal-success" 
            : "bg-red-500/10 border-red-500/20 text-red-200"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {loadingData ? (
        <div className="p-16 text-center text-portal-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-portal-primary mb-3" />
          <span>Reading configuration files...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form settings */}
          <form onSubmit={handleSaveSettings} className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl bg-portal-card border border-portal-border/60 space-y-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary flex items-center gap-2 border-b border-portal-border/40 pb-3">
                <Server className="w-4.5 h-4.5 text-portal-primary" />
                <span>Global LMS Flags</span>
              </h3>

              <div className="space-y-4">
                {/* Switch 1 */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Maintenance Mode</h4>
                    <p className="text-[10px] text-portal-text-secondary mt-0.5">Locks out general students and displays a lockout panel.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("maintenanceMode")}
                    className="text-portal-text-secondary hover:text-white transition-colors"
                  >
                    {settings.maintenanceMode ? (
                      <ToggleRight className="w-9 h-9 text-portal-primary" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-700" />
                    )}
                  </button>
                </div>

                <div className="border-t border-portal-border/30 my-3"></div>

                {/* Switch 2 */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Lock Registrations</h4>
                    <p className="text-[10px] text-portal-text-secondary mt-0.5">Disables profile creations on the public register screen.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("registrationClosed")}
                    className="text-portal-text-secondary hover:text-white transition-colors"
                  >
                    {settings.registrationClosed ? (
                      <ToggleRight className="w-9 h-9 text-portal-primary" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-700" />
                    )}
                  </button>
                </div>

                <div className="border-t border-portal-border/30 my-3"></div>

                {/* Switch 3 */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Verbose Diagnostics</h4>
                    <p className="text-[10px] text-portal-text-secondary mt-0.5">Enables full server-side auditing and verbose output logs.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("systemDiagnostics")}
                    className="text-portal-text-secondary hover:text-white transition-colors"
                  >
                    {settings.systemDiagnostics ? (
                      <ToggleRight className="w-9 h-9 text-portal-primary" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-700" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 rounded-xl bg-portal-primary hover:bg-portal-primary/90 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save System Settings</span>
            </button>
          </form>

          {/* Audit log viewer */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-portal-card border border-portal-border/60 space-y-4 shadow-sm h-[580px] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary border-b border-portal-border/40 pb-3 flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-portal-warning animate-pulse" />
                <span>Audit Logs Inspector</span>
              </h3>

              <div className="divide-y divide-portal-border/30 overflow-y-auto max-h-[460px] pr-1.5 scrollbar-thin">
                {logs.length === 0 ? (
                  <p className="p-12 text-xs text-portal-text-secondary italic text-center">No audit logs found in this database.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white uppercase tracking-wider px-2 py-0.5 rounded text-[8px] bg-slate-900 border border-portal-border/50 text-portal-secondary">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-portal-text-secondary font-mono">@{log.adminEmail}</span>
                        </div>
                        <p className="text-slate-300 text-xs leading-normal">{log.details}</p>
                      </div>

                      <div className="flex items-center gap-3.5 whitespace-nowrap ml-auto">
                        <div className="flex items-center gap-1 text-[9px] text-portal-text-secondary font-semibold">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-slate-700 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Purge Log entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
