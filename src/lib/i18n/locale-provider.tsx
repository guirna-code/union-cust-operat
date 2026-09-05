"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Dictionary, Locale } from "./types";
import { ar } from "./ar";
import { fr } from "./fr";
import { en } from "./en";

const dictionaries: Record<Locale, Dictionary> = { ar, fr, en };

type LocaleContextValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Dictionary;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "uc-locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Keep server rendering and the first client render identical. Restore the
  // saved preference after hydration without overwriting an early user click.
  const [selectedLocale, setLocaleState] = useState<Locale | null>(null);
  const locale = selectedLocale ?? "ar";

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
  }, []);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Browsing contexts with blocked storage still retain working in-memory switching.
    }
    const restored = stored === "ar" || stored === "fr" || stored === "en" ? stored : "ar";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore a browser-only preference after hydration
    setLocaleState((current) => current ?? restored);
  }, []);

  useEffect(() => {
    if (selectedLocale === null) return;

    const dict = dictionaries[selectedLocale];
    document.documentElement.lang = dict.htmlLang;
    document.documentElement.dir = dict.dir;
    document.documentElement.dataset.locale = selectedLocale;
    try {
      window.localStorage.setItem(STORAGE_KEY, selectedLocale);
    } catch {
      // The selected locale still applies for this session when storage is unavailable.
    }
  }, [selectedLocale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: dictionaries[locale].dir,
      t: dictionaries[locale],
      setLocale,
    }),
    [locale, setLocale],
  );

  const isProgramme = pathname.startsWith("/programme-electoral");
  // React hoists these tags into <head>. Keep one owner so navigation cannot
  // replace localized metadata with a competing static Arabic export.
  return (
    <LocaleContext.Provider value={value}>
      <title>{isProgramme ? value.t.meta.programmeTitle : value.t.meta.homeTitle}</title>
      <meta name="description" content={isProgramme ? value.t.meta.programmeDescription : value.t.meta.homeDescription} />
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
