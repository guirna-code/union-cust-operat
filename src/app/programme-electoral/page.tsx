import type { Metadata } from "next";
import { ProgrammeHero } from "@/components/programme/hero";
import { ProgrammeIntro } from "@/components/programme/intro";
import { KeyCommitments } from "@/components/programme/commitments";
import { ProgrammeCategories } from "@/components/programme/categories";
import { DetailedProgramme } from "@/components/programme/detailed-program";
import { DownloadProgramme } from "@/components/programme/download-cta";
import { ProgrammeFinalCta } from "@/components/programme/final-cta";
import { ProgrammeUIProvider } from "@/lib/programme-ui-context";
import { categoriesMeta } from "@/lib/program-data";

export const metadata: Metadata = {
  title: "البرنامج الانتخابي | الاتحاد الدستوري",
  description:
    "اكتشف البرنامج الانتخابي الكامل لحزب الاتحاد الدستوري: الاقتصاد، التشغيل، التعليم، الصحة، العدالة الاجتماعية، والتنمية المجالية.",
};

export default function ProgrammeElectoralPage() {
  return (
    <ProgrammeUIProvider defaultSlug={categoriesMeta[0]?.slug ?? null}>
      <ProgrammeHero />
      <ProgrammeIntro />
      <KeyCommitments />
      <ProgrammeCategories />
      <DetailedProgramme />
      <DownloadProgramme />
      <ProgrammeFinalCta />
    </ProgrammeUIProvider>
  );
}
