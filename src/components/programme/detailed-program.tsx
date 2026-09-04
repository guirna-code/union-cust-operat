"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { categoriesMeta } from "@/lib/program-data";
import { useLocale } from "@/lib/i18n";
import { useProgrammeUI } from "@/lib/programme-ui-context";
import { cn } from "@/lib/utils";

export function DetailedProgramme() {
  const { t } = useLocale();
  const { openSlug, setOpenSlug } = useProgrammeUI();
  const { detailedSection, categoriesSection } = t;

  return (
    <section id="detailed-programme" className="scroll-mt-20 bg-surface py-20 sm:py-28">
      <Container className="max-w-3xl">
        <SectionHeading
          eyebrow={detailedSection.eyebrow}
          title={detailedSection.title}
          description={detailedSection.description}
        />

        <div className="mt-12 divide-y divide-line rounded-2xl border border-line">
          {categoriesMeta.map((meta) => {
            const content = categoriesSection.items[meta.slug];
            if (!content) return null;

            const isOpen = openSlug === meta.slug;
            const Icon = meta.icon;
            return (
              <div key={meta.slug} id={`detail-${meta.slug}`} className="scroll-mt-20 rounded-2xl">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenSlug(isOpen ? null : meta.slug)}
                    aria-expanded={isOpen}
                    aria-controls={`panel-${meta.slug}`}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red sm:px-6"
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-red/10 text-red">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-base font-semibold text-ink sm:text-lg">
                        {content.title}
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-ink-soft transition-transform duration-300",
                        isOpen && "rotate-180 text-red",
                      )}
                    />
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      id={`panel-${meta.slug}`}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <ul className="grid gap-2.5 px-5 pb-6 sm:px-6">
                        {content.points.map((point) => (
                          <li
                            key={point}
                            className="flex items-start gap-2.5 text-sm leading-7 text-ink-soft sm:text-[15px]"
                          >
                            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
