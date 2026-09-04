"use client";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { useLocale } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useLocale();

  return (
    <footer id="contact" className="border-t border-line bg-ink text-cream-2">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-red text-sm font-bold text-surface">
              {t.header.partyShortBadge}
            </span>
            <span className="text-lg font-bold text-surface">{t.header.partyName}</span>
          </div>
          <p className="max-w-sm text-sm leading-7 text-cream-2/80">{t.footer.tagline}</p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-surface">{t.footer.quickLinksTitle}</h3>
          {t.footer.quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-cream-2/80 hover:text-surface">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-surface">{t.footer.contactTitle}</h3>
          <p className="text-sm text-cream-2/80">{t.footer.address}</p>
          <a href={`mailto:${t.footer.email}`} className="text-sm text-cream-2/80 hover:text-surface">
            {t.footer.email}
          </a>
        </div>
      </Container>

      <div className="border-t border-surface/10">
        <Container className="flex flex-col items-center justify-between gap-2 py-6 text-xs text-cream-2/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {t.header.partyName}. {t.footer.rights}
          </p>
          <p>{t.footer.programYear}</p>
        </Container>
      </div>
    </footer>
  );
}
