"use client";

import { Download, FileText } from "lucide-react";
import { Container } from "@/components/ui/container";
import { programPdfPath } from "@/lib/program-data";
import { useLocale } from "@/lib/i18n";

export function DownloadProgramme() {
  const { t } = useLocale();

  return (
    <section className="bg-cream py-16 sm:py-20">
      <Container>
        <div className="flex flex-col items-center gap-6 rounded-3xl border border-line bg-surface p-8 text-center shadow-sm sm:p-12">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red/10 text-red">
            <FileText className="h-8 w-8" />
          </span>
          <div>
            <h3 className="text-2xl font-bold text-ink sm:text-3xl">{t.download.title}</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-ink-soft sm:text-base">
              {t.download.description}
            </p>
          </div>

          <a
            href={programPdfPath}
            download
            className="inline-flex items-center gap-2 rounded-full bg-red px-8 py-4 text-base font-semibold text-surface shadow-lg shadow-red/30 transition-transform hover:-translate-y-0.5 hover:bg-gold"
          >
            <Download className="h-5 w-5" />
            {t.download.cta}
          </a>
        </div>
      </Container>
    </section>
  );
}
