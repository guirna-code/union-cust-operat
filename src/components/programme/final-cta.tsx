"use client";

import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";

export function ProgrammeFinalCta() {
  const { t } = useLocale();

  return (
    <section className="relative overflow-hidden bg-red py-20 text-surface sm:py-28">
      <Image src="/images/final-cta-bg.png" alt="" fill sizes="100vw" className="object-cover" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-red/80" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 30%, rgba(255,251,242,0.35), transparent 40%)",
        }}
      />
      <Container className="relative flex flex-col items-center text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl">{t.finalCta.title}</h2>

        <ul className="mt-8 grid gap-3 text-lg font-medium sm:text-xl">
          {t.finalCta.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <p className="mx-auto mt-8 max-w-2xl text-sm leading-8 text-surface/90 sm:text-base">
          {t.finalCta.closing}
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button href="/#contact" variant="secondary" size="lg">
            {t.finalCta.contact}
          </Button>
          <Button
            href="/"
            variant="outline"
            size="lg"
            className="border-surface/40 text-surface hover:bg-surface/10"
          >
            {t.finalCta.discoverVision}
          </Button>
        </div>
      </Container>
    </section>
  );
}
