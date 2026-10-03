"use client";

import React from "react";
import Link from "next/link";
import { Loader2, AlertTriangle, Lock } from "lucide-react";
import { useInventory } from "@/lib/InventoryContext";

export default function InventoryGate() {
  const { inventoryStatus, inventoryError, reloadInventory } = useInventory();
  if (inventoryStatus === "ready") return null;

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 text-[#f0ede6]">
      {inventoryStatus === "loading" && (
        <>
          <Loader2 className="w-6 h-6 text-[#e8c547] animate-spin mb-4" />
          <p className="font-mono text-sm text-[#888888]">Loading your inventory…</p>
        </>
      )}

      {inventoryStatus === "signed-out" && (
        <>
          <Lock className="w-6 h-6 text-[#e8c547] mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to manage your parts</h1>
          <p className="text-sm text-[#888888] max-w-md mb-6">
            Your inventory is saved to your account, so it follows you to any device.
          </p>
          <Link
            href="/login"
            className="px-5 py-2 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg text-sm transition-colors"
          >
            Sign in
          </Link>
        </>
      )}

      {inventoryStatus === "error" && (
        <>
          <AlertTriangle className="w-6 h-6 text-[#e06b35] mb-4" />
          <p className="text-sm mb-1">We couldn&apos;t load your inventory.</p>
          <p className="font-mono text-xs text-[#888888] mb-6 max-w-md">{inventoryError}</p>
          <button
            onClick={reloadInventory}
            className="px-5 py-2 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg text-sm transition-colors"
          >
            Try again
          </button>
        </>
      )}
    </main>
  );
}