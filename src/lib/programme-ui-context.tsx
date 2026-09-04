"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { smoothScrollToId } from "@/lib/scroll-to";

type ProgrammeUIContextValue = {
  openSlug: string | null;
  setOpenSlug: (slug: string | null) => void;
  openDetail: (slug: string) => void;
};

const ProgrammeUIContext = createContext<ProgrammeUIContextValue | null>(null);

export function ProgrammeUIProvider({
  children,
  defaultSlug = null,
}: {
  children: ReactNode;
  defaultSlug?: string | null;
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(defaultSlug);

  function openDetail(slug: string) {
    setOpenSlug(slug);
    requestAnimationFrame(() => {
      smoothScrollToId(`detail-${slug}`, { highlight: true });
    });
  }

  return (
    <ProgrammeUIContext.Provider value={{ openSlug, setOpenSlug, openDetail }}>
      {children}
    </ProgrammeUIContext.Provider>
  );
}

export function useProgrammeUI() {
  const ctx = useContext(ProgrammeUIContext);
  if (!ctx) {
    throw new Error("useProgrammeUI must be used within a ProgrammeUIProvider");
  }
  return ctx;
}
