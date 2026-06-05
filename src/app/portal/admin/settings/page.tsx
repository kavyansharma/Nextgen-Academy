"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  queryDocuments,
  getDocument,
  setDocument,
  logAdminAction,
  deleteDocument,
  uploadFile
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

  // Certificate Assets States
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [sealUrl, setSealUrl] = useState<string | null>(null);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isUploadingSeal, setIsUploadingSeal] = useState(false);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // File upload handler
  const handleUploadAsset = async (e: React.ChangeEvent<HTMLInputElement>, type: "background" | "signature" | "seal") => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const setter = type === "background" ? setIsUploadingBackground : type === "signature" ? setIsUploadingSignature : setIsUploadingSeal;
    setter(true);

    try {
      const path = `certificates/assets/${type}_${Date.now()}_${file.name}`;
      const url = await uploadFile(file, path);
      
      const currentDoc = await getDocument("settings", "certificate_assets") || {};
      const updatedData = {
        ...currentDoc,
        [type]: url,
        updatedAt: new Date().toISOString()
      };

      await setDocument("settings", "certificate_assets", updatedData);
      
      if (type === "background") setBackgroundUrl(url);
      else if (type === "signature") setSignatureUrl(url);
      else if (type === "seal") setSealUrl(url);

      await logAdminAction(
        user.uid,
        user.email || "",
        "UPLOAD_CERTIFICATE_ASSET",
        `Uploaded certificate custom asset: ${type}`
      );
      showToast("success", `Certificate ${type} asset uploaded and applied!`);
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      showToast("error", `Failed to upload ${type}.`);
    } finally {
      setter(false);
    }
  };

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
  const loadPlatformSettings = useCallback(async () => {
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

      // Load custom certificate assets
      const certData = await getDocument("settings", "certificate_assets") as any;
      if (certData) {
        setBackgroundUrl(certData.background || null);
        setSignatureUrl(certData.signature || null);
        setSealUrl(certData.seal || null);
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
  }, [user, showToast]);

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      loadPlatformSettings();
    };
    run();
  }, [loadPlatformSettings]);

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
    <div className="space-y-6 animate-fade-in text-portal-text-primary">
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
      <div className="border-b border-portal-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-portal-text-primary tracking-tight sm:text-4xl flex items-center gap-2">
            <Settings className="w-8 h-8 text-portal-primary animate-spin-slow" />
            <span>Platform Settings</span>
          </h1>
          <p className="text-sm text-portal-text-secondary mt-1">Configure global LMS maintenance flags, lock public registrations, and inspect logs.</p>
        </div>

        <button
          onClick={loadPlatformSettings}
          className="px-4 py-2.5 rounded-xl border border-portal-border hover:border-portal-primary bg-white text-xs font-bold text-portal-text-secondary hover:text-portal-primary transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Reload Settings</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex gap-3 p-4 rounded-xl text-sm border shadow-lg animate-fade-in ${
          toast.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-red-50 border-red-200 text-red-800"
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
          {/* Left Column (LMS Flags & Certificate customizer) */}
          <div className="lg:col-span-1 space-y-6">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-portal-border space-y-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary flex items-center gap-2 border-b border-portal-border pb-3">
                  <Server className="w-4 h-4 text-portal-primary" />
                  <span>Global LMS Flags</span>
                </h3>

                <div className="space-y-4">
                  {/* Switch 1 */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-portal-text-primary uppercase">Maintenance Mode</h4>
                      <p className="text-[10px] text-portal-text-secondary mt-0.5">Locks out general students and displays a lockout panel.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle("maintenanceMode")}
                      className="text-portal-text-secondary hover:text-portal-primary transition-colors"
                    >
                      {settings.maintenanceMode ? (
                        <ToggleRight className="w-9 h-9 text-portal-primary" />
                      ) : (
                        <ToggleLeft className="w-9 h-9 text-slate-300" />
                      )}
                    </button>
                  </div>

                  <div className="border-t border-portal-border/30 my-3"></div>

                  {/* Switch 2 */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-portal-text-primary uppercase">Lock Registrations</h4>
                      <p className="text-[10px] text-portal-text-secondary mt-0.5">Disables profile creations on the public register screen.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle("registrationClosed")}
                      className="text-portal-text-secondary hover:text-portal-primary transition-colors"
                    >
                      {settings.registrationClosed ? (
                        <ToggleRight className="w-9 h-9 text-portal-primary" />
                      ) : (
                        <ToggleLeft className="w-9 h-9 text-slate-300" />
                      )}
                    </button>
                  </div>

                  <div className="border-t border-portal-border/30 my-3"></div>

                  {/* Switch 3 */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-portal-text-primary uppercase">Verbose Diagnostics</h4>
                      <p className="text-[10px] text-portal-text-secondary mt-0.5">Enables full server-side auditing and verbose output logs.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle("systemDiagnostics")}
                      className="text-portal-text-secondary hover:text-portal-primary transition-colors"
                    >
                      {settings.systemDiagnostics ? (
                        <ToggleRight className="w-9 h-9 text-portal-primary" />
                      ) : (
                        <ToggleLeft className="w-9 h-9 text-slate-300" />
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

            {/* Custom Certificate Assets Panel */}
            <div className="p-6 rounded-2xl bg-white border border-portal-border space-y-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary flex items-center gap-2 border-b border-portal-border pb-3">
                <Settings className="w-4 h-4 text-portal-secondary animate-spin-slow" />
                <span>Certificate Customizer</span>
              </h3>

              <div className="space-y-5 text-xs text-portal-text-secondary">
                {/* Background Uploader */}
                <div className="space-y-2">
                  <h4 className="font-bold text-portal-text-primary uppercase text-[10px]">Background Template</h4>
                  {backgroundUrl ? (
                    <img src={backgroundUrl} alt="Background Preview" className="h-20 w-full object-cover rounded-xl border border-portal-border mb-2" />
                  ) : (
                    <p className="text-[10px] italic text-portal-text-secondary mb-2">No custom background template configured.</p>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadAsset(e, "background")}
                      disabled={isUploadingBackground}
                      className="hidden"
                      id="bg-upload-input"
                    />
                    <label
                      htmlFor="bg-upload-input"
                      className="px-4 py-2 bg-white border border-portal-border hover:border-portal-primary rounded-xl font-semibold text-portal-text-secondary hover:text-portal-primary transition-all cursor-pointer flex items-center gap-1"
                    >
                      {isUploadingBackground && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{backgroundUrl ? "Change Background" : "Upload Background"}</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-portal-border/30 my-2"></div>

                {/* Signature Uploader */}
                <div className="space-y-2">
                  <h4 className="font-bold text-portal-text-primary uppercase text-[10px]">Authorized Signature</h4>
                  {signatureUrl ? (
                    <img src={signatureUrl} alt="Signature Preview" className="h-12 w-32 object-contain bg-slate-50 rounded-xl border border-portal-border p-1 mb-2" />
                  ) : (
                    <p className="text-[10px] italic text-portal-text-secondary mb-2">No authorized signature uploaded.</p>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadAsset(e, "signature")}
                      disabled={isUploadingSignature}
                      className="hidden"
                      id="sig-upload-input"
                    />
                    <label
                      htmlFor="sig-upload-input"
                      className="px-4 py-2 bg-white border border-portal-border hover:border-portal-primary rounded-xl font-semibold text-portal-text-secondary hover:text-portal-primary transition-all cursor-pointer flex items-center gap-1"
                    >
                      {isUploadingSignature && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{signatureUrl ? "Change Signature" : "Upload Signature"}</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-portal-border/30 my-2"></div>

                {/* Seal Uploader */}
                <div className="space-y-2">
                  <h4 className="font-bold text-portal-text-primary uppercase text-[10px]">Corporate Seal / Logo</h4>
                  {sealUrl ? (
                    <img src={sealUrl} alt="Seal Preview" className="h-16 w-16 object-contain bg-slate-50 rounded-xl border border-portal-border p-1 mb-2" />
                  ) : (
                    <p className="text-[10px] italic text-portal-text-secondary mb-2">No corporate seal/logo uploaded.</p>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadAsset(e, "seal")}
                      disabled={isUploadingSeal}
                      className="hidden"
                      id="seal-upload-input"
                    />
                    <label
                      htmlFor="seal-upload-input"
                      className="px-4 py-2 bg-white border border-portal-border hover:border-portal-primary rounded-xl font-semibold text-portal-text-secondary hover:text-portal-primary transition-all cursor-pointer flex items-center gap-1"
                    >
                      {isUploadingSeal && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{sealUrl ? "Change Seal" : "Upload Seal"}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit log viewer */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-portal-border space-y-4 shadow-sm h-[580px] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-portal-text-secondary border-b border-portal-border pb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500 animate-pulse" />
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
                          <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[8px] bg-blue-50 border border-blue-100 text-blue-700">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-portal-text-secondary font-mono">@{log.adminEmail}</span>
                        </div>
                        <p className="text-portal-text-primary text-xs leading-normal">{log.details}</p>
                      </div>

                      <div className="flex items-center gap-3.5 whitespace-nowrap ml-auto">
                        <div className="flex items-center gap-1 text-[9px] text-portal-text-secondary font-semibold">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
