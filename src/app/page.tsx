"use client";

import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { useLocale } from "@/lib/i18n";

export default function Home() {
  const { t } = useLocale();

  return (
    <>
      <section className="relative overflow-hidden bg-ink py-24 text-surface sm:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(138,83,34,0.25), transparent 45%), radial-gradient(circle at 80% 0%, rgba(214,133,44,0.35), transparent 40%)",
          }}
        />
        <Container className="relative flex flex-col items-center text-center">
          <span className="rounded-full border border-surface/15 bg-surface/5 px-4 py-1.5 text-sm font-medium text-gold">
            {t.home.badge}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-6xl">
            {t.home.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-cream-2/90 sm:text-lg">
            {t.home.subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button href="/programme-electoral#categories" size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              {t.home.ctaMoroccoStronger}
            </Button>
            <Button href="/programme-electoral" variant="outline" size="lg" className="border-surface/20 text-surface hover:bg-surface/10">
              {t.home.ctaDiscover}
            </Button>
          </div>
        </Container>
      </section>

      <section id="about" className="bg-surface py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow={t.home.aboutEyebrow}
            title={t.home.aboutTitle}
            description={t.home.aboutDescription}
          />
        </Container>
      </section>
    </>
  );
}
