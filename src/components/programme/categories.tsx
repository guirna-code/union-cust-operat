"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { categoriesMeta } from "@/lib/program-data";
import { useLocale } from "@/lib/i18n";
import { useProgrammeUI } from "@/lib/programme-ui-context";

export function ProgrammeCategories() {
  const { t } = useLocale();
  const { openDetail } = useProgrammeUI();
  const { categoriesSection } = t;

  return (
    <section id="categories" className="scroll-mt-20 bg-cream py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow={categoriesSection.eyebrow}
          title={categoriesSection.title}
          description={categoriesSection.description}
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categoriesMeta.map((meta, index) => {
            const Icon = meta.icon;
            const content = categoriesSection.items[meta.slug];
            if (!content) return null;

            return (
              <motion.div
                key={meta.slug}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: (index % 3) * 0.08 }}
                className="group flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-red/10 text-red">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-3xl font-extrabold tabular-nums text-gold/45" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink">{content.title}</h3>
                <p className="flex-1 text-sm leading-7 text-ink-soft">{content.description}</p>
                <a
                  href={`#detail-${meta.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    openDetail(meta.slug);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-red transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1"
                >
                  {categoriesSection.discoverMore}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
                </a>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
