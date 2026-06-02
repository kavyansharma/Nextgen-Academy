"use client";

import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function FirestoreTestPage() {
  const [status, setStatus] = useState<"idle" | "writing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTestWrite = async () => {
    setStatus("writing");
    setErrorMsg(null);
    console.log("TEST_WRITE_START");

    try {
      await setDoc(doc(db, "connection_test", "hello"), {
        message: "Firestore works",
        timestamp: new Date().toISOString()
      });
      setStatus("success");
      console.log("TEST_WRITE_SUCCESS");
    } catch (err: any) {
      console.error("TEST_WRITE_ERROR", err);
      setStatus("error");
      setErrorMsg(err?.message || err?.toString() || "Unknown error");
    }
  };

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center px-4 py-12 bg-brand-dark overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 border border-white/5 shadow-2xl rounded-3xl p-8 glass z-10 text-center space-y-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Firestore Connection Test</h1>
        <p className="text-sm text-brand-text-muted">
          Click the button below to perform a raw write to the <code>connection_test</code> collection.
        </p>

        <button
          onClick={handleTestWrite}
          disabled={status === "writing"}
          className="w-full py-3.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "writing" ? "Writing..." : "Write Test Document"}
        </button>

        {status === "success" && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm">
            ✓ Write Successful! Document written to <code>connection_test/hello</code>.
          </div>
        )}

        {status === "error" && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-left space-y-2">
            <p className="font-bold">✗ Write Failed</p>
            <p className="text-xs font-mono whitespace-pre-wrap break-all bg-slate-950 p-3 rounded-lg border border-red-500/25">
              {errorMsg}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
