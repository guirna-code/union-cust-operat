"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex shrink-0 items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-red text-sm font-bold text-surface">
            {t.header.partyShortBadge}
          </span>
          <span className="whitespace-nowrap text-base font-bold text-ink sm:text-lg">{t.header.partyName}</span>
        </Link>

        <nav className="hidden items-center gap-4 lg:flex xl:gap-7">
          {t.header.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-sm font-medium text-ink-soft transition-colors hover:text-red"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <Button href="/programme-electoral" size="sm">
            {t.header.ctaDiscover}
          </Button>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full text-ink lg:hidden"
          aria-label={open ? t.header.closeMenu : t.header.openMenu}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      <div
        className={cn(
          "grid overflow-hidden border-t border-line bg-surface transition-[grid-template-rows] duration-300 lg:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0">
          <Container className="flex flex-col gap-1 py-3">
            {t.header.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-red/5 hover:text-red"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between gap-3">
              <LanguageSwitcher />
              <Button href="/programme-electoral" size="sm" className="flex-1" onClick={() => setOpen(false)}>
                {t.header.ctaDiscover}
              </Button>
            </div>
          </Container>
        </div>
      </div>
    </header>
  );
}
