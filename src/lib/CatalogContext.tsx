"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchCatalog } from "@/lib/catalog";
import type { CatalogComponent, CatalogProject } from "@/lib/types";

type State =
  | { status: "loading" }
  | { status: "ready"; components: CatalogComponent[]; projects: CatalogProject[] }
  | { status: "error"; message: string };

type CatalogContextType = {
  status: State["status"];
  error: string | null;
  components: CatalogComponent[];
  projects: CatalogProject[];
  nameOf: (componentId: string) => string;
  reload: () => void;
};

// Module-level constants so "no data yet" is always the same array identity
const NO_COMPONENTS: CatalogComponent[] = [];
const NO_PROJECTS: CatalogProject[] = [];

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchCatalog()
      .then(({ components, projects }) => {
        if (!cancelled) setState({ status: "ready", components, projects });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Couldn't load the catalog.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo<CatalogContextType>(() => {
    const components = state.status === "ready" ? state.components : NO_COMPONENTS;
    const projects = state.status === "ready" ? state.projects : NO_PROJECTS;
    const names = new Map(components.map((c) => [c.id, c.name]));

    return {
      status: state.status,
      error: state.status === "error" ? state.message : null,
      components,
      projects,
      nameOf: (id: string) => names.get(String(id)) ?? `Component #${id}`,
      reload,
    };
  }, [state, reload]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (ctx === undefined) {
    throw new Error("useCatalog must be used within a CatalogProvider");
  }
  return ctx;
}