"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
  const [locale, setLocaleState] = useState<Locale>("ar");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "fr" || stored === "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a client-only persisted preference on mount
      setLocaleState(stored);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const dict = dictionaries[locale] ?? dictionaries.ar;
    document.documentElement.lang = dict.htmlLang;
    document.documentElement.dir = dict.dir;
    window.localStorage.setItem(STORAGE_KEY, locale);

    const isProgramme = window.location.pathname.includes("programme");
    document.title = isProgramme ? dict.meta.programmeTitle : dict.meta.homeTitle;
  }, [initialized, locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: dictionaries[locale].dir,
      t: dictionaries[locale],
      setLocale: setLocaleState,
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
