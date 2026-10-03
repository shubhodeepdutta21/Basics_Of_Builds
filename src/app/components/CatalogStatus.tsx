"use client";

import React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { useCatalog } from "@/lib/CatalogContext";

// Renders the loading / error screen. Returns null once the catalog is ready.
export default function CatalogStatus() {
  const { status, error, reload } = useCatalog();
  if (status === "ready") return null;

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 text-[#f0ede6]">
      {status === "loading" ? (
        <>
          <Loader2 className="w-6 h-6 text-[#e8c547] animate-spin mb-4" />
          <p className="font-mono text-sm text-[#888888]">Loading the parts catalog…</p>
        </>
      ) : (
        <>
          <AlertTriangle className="w-6 h-6 text-[#e06b35] mb-4" />
          <p className="text-sm mb-1">We couldn&apos;t load the catalog.</p>
          <p className="font-mono text-xs text-[#888888] mb-6 max-w-md">{error}</p>
          <button
            onClick={reload}
            className="px-5 py-2 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg text-sm transition-colors"
          >
            Try again
          </button>
        </>
      )}
    </main>
  );
}