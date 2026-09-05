import { ProgrammeHero } from "@/components/programme/hero";
import { ProgrammeIntro } from "@/components/programme/intro";
import { KeyCommitments } from "@/components/programme/commitments";
import { ProgrammeCategories } from "@/components/programme/categories";
import { DownloadProgramme } from "@/components/programme/download-cta";
import { ProgrammeFinalCta } from "@/components/programme/final-cta";

export default function ProgrammeElectoralPage() {
  return (
    <>
      <ProgrammeHero />
      <ProgrammeIntro />
      <KeyCommitments />
      <ProgrammeCategories />
      <DownloadProgramme />
      <ProgrammeFinalCta />
    </>
  );
}
