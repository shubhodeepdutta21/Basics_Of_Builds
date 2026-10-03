"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Metadata a custom part carries with it (stored on its inventory row)
export type ComponentMeta = {
  name?: string;
  category?: string;
  description?: string;
};

export type InventoryItem = {
  componentId: string;
  quantity: number;
} & ComponentMeta;

export type AIProject = {
  id?: string;
  title: string;
  description: string;
  difficultyLevel?: string;
  estimatedTime?: string;
  requirements?: unknown[];
  steps?: string[];
} | null;

export type InventoryStatus = "loading" | "signed-out" | "ready" | "error";

type InventoryContextType = {
  inventory: InventoryItem[];
  inventoryStatus: InventoryStatus;
  inventoryError: string | null;
  reloadInventory: () => void;
  syncError: string | null;
  clearSyncError: () => void;
  addToInventory: (componentId: string, quantity?: number, meta?: ComponentMeta) => void;
  removeFromInventory: (componentId: string) => void;
  clearInventory: () => void;
  getQuantity: (componentId: string) => number;
  aiProject: AIProject;
  setAiProject: (project: AIProject) => void;
  clearAiProject: () => void;
};

const CUSTOM_PREFIX = "custom_";
const MAX_QTY = 999;
const NO_ITEMS: InventoryItem[] = [];

// Old catalog ids that were merged into another part
const LEGACY_ID_MAP: Record<string, string> = { comp_oled: "5" };

// ─── Database rows <-> app items ─────────────────────────────────────────────
type InventoryRow = {
  id: string;
  component_id: string | null;
  custom_name: string | null;
  custom_category: string | null;
  custom_description: string | null;
  quantity: number;
};

const rowToItem = (r: InventoryRow): InventoryItem =>
  r.component_id !== null
    ? { componentId: r.component_id, quantity: r.quantity }
    : {
        componentId: `${CUSTOM_PREFIX}${r.id}`,
        quantity: r.quantity,
        name: r.custom_name ?? undefined,
        category: r.custom_category ?? undefined,
        description: r.custom_description ?? undefined,
      };

async function fetchInventory(): Promise<InventoryItem[]> {
  // RLS guarantees this only ever returns the signed-in user's rows
  const { data, error } = await supabase
    .from("user_inventory")
    .select("id, component_id, custom_name, custom_category, custom_description, quantity")
    .order("created_at");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as InventoryRow[]).map(rowToItem);
}

// Write one item's quantity: quantity <= 0 means delete the row
async function persistQuantity(userId: string, item: InventoryItem, quantity: number): Promise<void> {
  if (item.componentId.startsWith(CUSTOM_PREFIX)) {
    const rowId = item.componentId.slice(CUSTOM_PREFIX.length);
    const { error } =
      quantity <= 0
        ? await supabase.from("user_inventory").delete().eq("id", rowId)
        : await supabase.from("user_inventory").upsert(
            {
              id: rowId,
              user_id: userId,
              custom_name: item.name ?? "Custom part",
              custom_category: item.category ?? null,
              custom_description: item.description ?? null,
              quantity,
            },
            { onConflict: "id" }
          );
    if (error) throw new Error(error.message);
    return;
  }

  const { error } =
    quantity <= 0
      ? await supabase.from("user_inventory").delete().eq("user_id", userId).eq("component_id", item.componentId)
      : await supabase
          .from("user_inventory")
          .upsert({ user_id: userId, component_id: item.componentId, quantity }, { onConflict: "user_id,component_id" });
  if (error) throw new Error(error.message);
}

// ─── One-time import of the old browser-only inventory ───────────────────────
const importing = new Map<string, Promise<boolean>>();

// Shared promise per user, so React Strict Mode's double-run can't import twice
function importLegacyInventory(userId: string): Promise<boolean> {
  let p = importing.get(userId);
  if (!p) {
    p = doImport(userId).finally(() => importing.delete(userId));
    importing.set(userId, p);
  }
  return p;
}

async function doImport(userId: string): Promise<boolean> {
  let saved: unknown;
  try {
    const raw = localStorage.getItem("bob_inventory") || localStorage.getItem("hackhorizon_inventory");
    if (!raw) return false;
    saved = JSON.parse(raw);
  } catch {
    return false;
  }
  if (!Array.isArray(saved) || saved.length === 0) return false;

  // The foreign key would reject the whole batch if one id is unknown, so filter first
  const { data: comps, error: compErr } = await supabase.from("components").select("id");
  if (compErr) throw new Error(compErr.message);
  const known = new Set(((comps ?? []) as unknown as { id: string }[]).map((c) => c.id));

  const catalogTotals = new Map<string, number>();
  const customRows: Record<string, unknown>[] = [];

  for (const entry of saved as unknown[]) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const rawId = typeof e.componentId === "string" ? e.componentId : "";
    const qty = Math.min(MAX_QTY, Math.floor(Number(e.quantity)));
    if (!rawId || !Number.isFinite(qty) || qty < 1) continue;

    if (rawId.startsWith(CUSTOM_PREFIX)) {
      const name = typeof e.name === "string" ? e.name.trim().slice(0, 100) : "";
      if (!name) continue; // an unnamed custom part can't be recovered
      customRows.push({
        id: crypto.randomUUID(),
        user_id: userId,
        custom_name: name,
        custom_category: typeof e.category === "string" ? e.category.slice(0, 50) : null,
        custom_description: typeof e.description === "string" ? e.description.slice(0, 500) : null,
        quantity: qty,
      });
    } else {
      const id = LEGACY_ID_MAP[rawId] ?? rawId;
      if (!known.has(id)) continue;
      catalogTotals.set(id, Math.min(MAX_QTY, (catalogTotals.get(id) ?? 0) + qty));
    }
  }

  // Two separate writes: rows with different columns must not share one bulk insert
  const catalogRows = Array.from(catalogTotals, ([component_id, quantity]) => ({
    user_id: userId,
    component_id,
    quantity,
  }));

  if (catalogRows.length > 0) {
    const { error } = await supabase
      .from("user_inventory")
      .upsert(catalogRows, { onConflict: "user_id,component_id" });
    if (error) throw new Error(error.message);
  }
  if (customRows.length > 0) {
    const { error } = await supabase.from("user_inventory").insert(customRows);
    if (error) throw new Error(error.message);
  }

  // Only after both writes succeeded: the cloud copy is now the source of truth
  localStorage.removeItem("bob_inventory");
  localStorage.removeItem("hackhorizon_inventory");
  return catalogRows.length + customRows.length > 0;
}

// ─── Provider ────────────────────────────────────────────────────────────────
type AuthState = { ready: boolean; userId: string | null };
type Loaded = { userId: string; items: InventoryItem[] } | null;

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ ready: false, userId: null });
  const [loaded, setLoaded] = useState<Loaded>(null);
  const [loadError, setLoadError] = useState<{ userId: string; message: string } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [aiProject, setAiProjectState] = useState<AIProject>(null);

  // Writes run one at a time, in click order, so a slow request can't overwrite a newer one
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const userId = auth.userId;

  // Derived, never synced by hand: what the UI should show right now
  const inventory = loaded && loaded.userId === userId ? loaded.items : NO_ITEMS;

  let inventoryStatus: InventoryStatus;
  if (!auth.ready) inventoryStatus = "loading";
  else if (!userId) inventoryStatus = "signed-out";
  else if (loaded?.userId === userId) inventoryStatus = "ready";
  else if (loadError?.userId === userId) inventoryStatus = "error";
  else inventoryStatus = "loading";

  // ── Who is signed in? (the callback only sets state; it never awaits other Supabase calls)
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const id = session?.user?.id ?? null;
      setAuth((prev) => (prev.ready && prev.userId === id ? prev : { ready: true, userId: id }));

      if (event === "SIGNED_OUT") {
        // Don't leave one person's draft project and chats behind for the next person
        try {
          localStorage.removeItem("bob_ai_project");
          Object.keys(localStorage)
            .filter((k) => k.startsWith("bob_chat_"))
            .forEach((k) => localStorage.removeItem(k));
        } catch {
          /* storage unavailable: nothing to clean */
        }
        setAiProjectState(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // ── Load this user's inventory (and import the old browser-only one, once)
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        let items = await fetchInventory();
        if (items.length === 0 && (await importLegacyInventory(userId))) {
          items = await fetchInventory();
        }
        if (!cancelled) setLoaded({ userId, items });
      } catch (err) {
        if (!cancelled) {
          setLoadError({
            userId,
            message: err instanceof Error ? err.message : "Couldn't load your inventory.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  // ── AI project draft still lives in this browser
  // localStorage only exists in the browser, so it must be read after mount.
  // Setting state here is intentional: it avoids a server/client hydration mismatch.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = localStorage.getItem("bob_ai_project");
    if (saved) {
      try {
        setAiProjectState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse AI project from storage", e);
      }
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setAiProject = (project: AIProject) => {
    setAiProjectState(project);
    if (project) {
      localStorage.setItem("bob_ai_project", JSON.stringify(project));
    } else {
      localStorage.removeItem("bob_ai_project");
    }
  };

  const clearAiProject = () => {
    setAiProjectState(null);
    localStorage.removeItem("bob_ai_project");
  };

  // ── Optimistic writes: update the screen now, save in the background.
  // If a save fails, tell the user and reload the truth from the database.
  const enqueue = (task: () => Promise<void>) => {
    queueRef.current = queueRef.current.then(task).catch((err: unknown) => {
      console.error("Inventory sync failed:", err);
      setSyncError("Couldn't save your last change, so your inventory was refreshed from the server.");
      setReloadKey((k) => k + 1);
    });
  };

  const setLocal = (items: InventoryItem[]) => {
    if (userId) setLoaded({ userId, items });
  };

  const addToInventory = (componentId: string, quantity: number = 1, meta?: ComponentMeta) => {
    if (!userId || inventoryStatus !== "ready") return;

    const existing = inventory.find((i) => i.componentId === componentId);
    const newQty = Math.min(MAX_QTY, (existing?.quantity ?? 0) + quantity);
    if (!existing && newQty <= 0) return; // never create an item from a decrement

    const item: InventoryItem = existing ?? { componentId, quantity: newQty, ...meta };

    if (newQty <= 0) {
      setLocal(inventory.filter((i) => i.componentId !== componentId));
    } else if (existing) {
      setLocal(inventory.map((i) => (i.componentId === componentId ? { ...i, quantity: newQty } : i)));
    } else {
      setLocal([...inventory, item]);
    }

    enqueue(() => persistQuantity(userId, item, newQty));
  };

  const removeFromInventory = (componentId: string) => {
    if (!userId || inventoryStatus !== "ready") return;
    const item = inventory.find((i) => i.componentId === componentId);
    if (!item) return;
    setLocal(inventory.filter((i) => i.componentId !== componentId));
    enqueue(() => persistQuantity(userId, item, 0));
  };

  const clearInventory = () => {
    if (!userId || inventoryStatus !== "ready") return;
    setLocal([]);
    enqueue(async () => {
      const { error } = await supabase.from("user_inventory").delete().eq("user_id", userId);
      if (error) throw new Error(error.message);
    });
  };

  const getQuantity = (componentId: string) =>
    inventory.find((i) => i.componentId === componentId)?.quantity ?? 0;

  const reloadInventory = () => {
    setLoadError(null);
    setReloadKey((k) => k + 1);
  };

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        inventoryStatus,
        inventoryError: loadError && loadError.userId === userId ? loadError.message : null,
        reloadInventory,
        syncError,
        clearSyncError: () => setSyncError(null),
        addToInventory,
        removeFromInventory,
        clearInventory,
        getQuantity,
        aiProject,
        setAiProject,
        clearAiProject,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}