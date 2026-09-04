"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowDown, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { useLocale } from "@/lib/i18n";
import { smoothScrollToId } from "@/lib/scroll-to";

export function ProgrammeHero() {
  const { t } = useLocale();

  function handleMoroccoStronger(e: React.MouseEvent) {
    e.preventDefault();
    smoothScrollToId("categories", { highlight: true });
  }

  return (
    <section className="relative overflow-hidden bg-ink py-24 text-surface sm:py-32">
      <Image
        src="/images/programme-hero-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink/75" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(138,83,34,0.25), transparent 45%), radial-gradient(circle at 80% 0%, rgba(214,133,44,0.35), transparent 40%)",
        }}
      />

      <Container className="relative flex flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-full border border-surface/15 bg-surface/5 px-4 py-1.5 text-sm font-medium text-gold"
        >
          {t.hero.eyebrow}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-4xl font-extrabold leading-tight sm:text-6xl"
        >
          {t.hero.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-lg font-semibold text-gold sm:text-xl"
        >
          {t.hero.slogan}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 max-w-2xl text-base leading-8 text-cream-2/90 sm:text-lg"
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <a
            href="#categories"
            onClick={handleMoroccoStronger}
            className="inline-flex items-center gap-2 rounded-full bg-red px-8 py-4 text-base font-semibold text-surface shadow-lg shadow-red/30 transition-transform hover:-translate-y-0.5 hover:bg-gold"
          >
            <Sparkles className="h-4 w-4" />
            {t.hero.ctaMoroccoStronger}
          </a>
          <a
            href="#categories"
            onClick={handleMoroccoStronger}
            className="inline-flex items-center gap-2 rounded-full border border-surface/20 px-8 py-4 text-base font-semibold text-surface transition-colors hover:bg-surface/10"
          >
            {t.hero.cta}
            <ArrowDown className="h-4 w-4" />
          </a>
        </motion.div>
      </Container>
    </section>
  );
}
