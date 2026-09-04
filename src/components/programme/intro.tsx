"use client";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { useLocale } from "@/lib/i18n";

export function ProgrammeIntro() {
  const { t } = useLocale();

  return (
    <section className="bg-surface py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow={t.intro.eyebrow} title={t.intro.title} />

        <div className="mx-auto mt-12 grid max-w-4xl gap-6">
          {t.intro.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0
                  ? "text-lg leading-9 text-ink-soft first-letter:ms-1 first-letter:text-4xl first-letter:font-bold first-letter:text-red"
                  : "text-lg leading-9 text-ink-soft"
              }
            >
              {paragraph}
            </p>
          ))}
        </div>
      </Container>
    </section>
  );
}
