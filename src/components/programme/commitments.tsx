"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { useLocale } from "@/lib/i18n";
import { commitmentsMeta } from "@/lib/program-data";

export function KeyCommitments() {
  const { t } = useLocale();
  const { commitmentsSection } = t;

  return (
    <section
      id="commitments"
      className="relative scroll-mt-20 overflow-hidden bg-ink py-20 text-surface sm:py-28"
    >
      <Image
        src="/images/commitments-bg.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink/75" />
      <Container className="relative">
        <SectionHeading
          eyebrow={commitmentsSection.eyebrow}
          title={commitmentsSection.title}
          description={commitmentsSection.description}
          className="[&_h2]:text-surface [&_p]:text-cream-2/90"
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {commitmentsSection.items.map((item, index) => (
            <motion.div
              key={item.number}
              id={`commitment-${commitmentsMeta[index].slug}`}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="flex gap-5 rounded-2xl border border-surface/10 bg-surface/5 p-6"
            >
              <span className="text-5xl font-extrabold text-gold/80">{item.number}</span>
              <div className="flex flex-1 flex-col">
                <h3 className="text-lg font-bold text-surface">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-cream-2/90">{item.description}</p>
                <Link
                  href={`/programme-electoral/engagements/${commitmentsMeta[index].slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-gold transition-colors hover:text-surface"
                >
                  {t.categoriesSection.discoverMore}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
