"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const locales = ["ar", "fr", "en"] as const;

  function cycleLocale() {
    const currentIndex = locales.indexOf(locale);
    setLocale(locales[(currentIndex + 1) % locales.length]);
  }

  return (
    <div
      dir="ltr"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1 text-xs font-semibold",
        className,
      )}
      role="group"
      aria-label={t.languageSwitcher.label}
    >
      <Languages className="ms-1.5 h-4 w-4 text-ink-soft" aria-hidden />
      <button
        type="button"
        onClick={cycleLocale}
        className="rounded-full px-1 text-ink-soft transition-colors hover:text-ink"
        aria-label={t.languageSwitcher.label}
      >
        {t.languageSwitcher.label}
      </button>
      <button
        lang="ar"
        dir="rtl"
        type="button"
        onClick={() => setLocale("ar")}
        aria-pressed={locale === "ar"}
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          locale === "ar" ? "bg-red text-surface" : "text-ink-soft hover:text-ink",
        )}
      >
        {t.languageSwitcher.ar}
      </button>
      <button
        lang="fr"
        type="button"
        onClick={() => setLocale("fr")}
        aria-pressed={locale === "fr"}
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          locale === "fr" ? "bg-red text-surface" : "text-ink-soft hover:text-ink",
        )}
      >
        {t.languageSwitcher.fr}
      </button>
      <button
        lang="en"
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          locale === "en" ? "bg-red text-surface" : "text-ink-soft hover:text-ink",
        )}
      >
        {t.languageSwitcher.en}
      </button>
    </div>
  );
}
