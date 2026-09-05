"use client";

import { SourceContent } from "./source-content";
import type { ProgramSource } from "@/lib/programme-source";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { categoriesMeta, commitmentsMeta } from "@/lib/program-data";
import { useLocale, type CategorySlug, type CommitmentSlug } from "@/lib/i18n";

type ProgramDetailPageProps =
  | { kind: "axis"; slug: CategorySlug; source: ProgramSource }
  | { kind: "commitment"; slug: CommitmentSlug; source: ProgramSource };

export function ProgramDetailPage(props: ProgramDetailPageProps) {
  const { t, dir, locale } = useLocale();
  const reduceMotion = useReducedMotion();
  const isAxis = props.kind === "axis";
  const collection = isAxis ? categoriesMeta : commitmentsMeta;
  const currentIndex = collection.findIndex((item) => item.slug === props.slug);
  const previous = currentIndex > 0 ? collection[currentIndex - 1] : null;
  const next = currentIndex < collection.length - 1 ? collection[currentIndex + 1] : null;
  const basePath = isAxis ? "/programme-electoral/axes" : "/programme-electoral/engagements";
  const backHref = isAxis
    ? `/programme-electoral#axis-${props.slug}`
    : `/programme-electoral#commitment-${props.slug}`;
  const number = String(currentIndex + 1).padStart(2, "0");

  const axisContent = isAxis ? t.categoriesSection.items[props.slug] : null;
  const commitmentMeta = !isAxis ? commitmentsMeta[currentIndex] : null;
  const commitmentContent = !isAxis ? t.commitmentsSection.items[currentIndex] : null;
  const title = axisContent?.title ?? commitmentContent?.title ?? "";
  const description = locale === props.source.language
    ? ""
    : axisContent?.description ?? commitmentContent?.description ?? "";

  return (
    <article className="bg-cream" dir={dir}>
      <section className="relative overflow-hidden bg-ink py-16 text-surface sm:py-24">
        <div aria-hidden className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_10%,rgba(214,133,44,.45),transparent_38%)]" />
        <Container className="relative max-w-5xl">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-surface/20 px-4 py-2 text-sm font-semibold text-cream-2 transition-colors hover:border-gold hover:text-surface"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {isAxis ? t.detailPage.backToAxes : t.detailPage.backToCommitments}
          </Link>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38 }}
            className="mt-12 grid gap-8 md:grid-cols-[auto_1fr] md:items-start"
          >
            <span className="text-7xl font-extrabold tabular-nums text-gold sm:text-8xl">{number}</span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold">
                {isAxis ? t.detailPage.axisEyebrow : t.detailPage.commitmentEyebrow}
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              {description && <p className="mt-6 max-w-3xl text-base leading-8 text-cream-2 sm:text-lg">{description}</p>}
            </div>
          </motion.div>
        </Container>
      </section>

      <Container className="max-w-5xl py-16 sm:py-24">
        {props.kind === "axis" && locale !== props.source.language && axisContent && (
              <section data-localized-axis aria-labelledby="measures-title" className="mb-12">
                <p className="text-sm font-bold text-red">{t.detailPage.overview}</p>
                <h2 id="measures-title" className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">{t.detailPage.measures}</h2>
                <ul className="mt-8 grid gap-4 md:grid-cols-2">
                  {axisContent.points.map((point) => (
                    <li key={point} className="rounded-2xl border border-line bg-surface p-5 text-base leading-8 text-ink-soft shadow-sm">{point}</li>
                  ))}
                </ul>
              </section>
        )}

        {commitmentMeta && locale !== props.source.language ? (
          <section aria-labelledby="priorities-title" className="mb-12">
            <p className="text-sm font-bold text-red">{t.detailPage.overview}</p>
            <h2 id="priorities-title" className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
              {t.detailPage.relatedPriorities}
            </h2>
            <div className="mt-10 space-y-6">
              {commitmentMeta.relatedAxes.map((slug, sectionIndex) => {
                const content = t.categoriesSection.items[slug];
                const metaIndex = categoriesMeta.findIndex((item) => item.slug === slug);
                return (
                  <motion.section
                    key={slug}
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.35, delay: sectionIndex * 0.04 }}
                    className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl font-extrabold tabular-nums text-gold/55">
                        {String(metaIndex + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-ink sm:text-2xl">{content.title}</h3>
                        <p className="mt-2 leading-7 text-ink-soft">{content.description}</p>
                      </div>
                    </div>
                    <ul className="mt-6 grid gap-3 md:grid-cols-2">
                      {content.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5 text-sm leading-7 text-ink-soft">
                          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.section>
                );
              })}
            </div>
          </section>
        ) : null}

        <section>
          {t.detailPage.sourceLanguageNotice && <p className="mb-8 rounded-2xl border border-line bg-surface p-5 text-ink-soft">{t.detailPage.sourceLanguageNotice}</p>}
          <SourceContent source={props.source} />
        </section>

        <nav className="mt-14 grid gap-3 border-t border-line pt-8 sm:grid-cols-2" aria-label={`${t.detailPage.previous} / ${t.detailPage.next}`}>
          {previous ? (
            <Link href={`${basePath}/${previous.slug}`} className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-gold hover:shadow-md">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t.detailPage.previous}
              </span>
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`${basePath}/${next.slug}`} className="group rounded-2xl border border-line bg-surface p-5 text-end transition hover:border-gold hover:shadow-md">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red">
                {t.detailPage.next} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </span>
            </Link>
          ) : null}
        </nav>
      </Container>
    </article>
  );
}
