import { notFound } from "next/navigation";
import { ProgramDetailPage } from "@/components/programme/program-detail-page";
import { commitmentsMeta } from "@/lib/program-data";
import type { CommitmentSlug } from "@/lib/i18n";
import { getCommitmentSource } from "@/lib/programme-source.server";

export function generateStaticParams() {
  return commitmentsMeta.map(({ slug }) => ({ slug }));
}

export default async function CommitmentDetailPage(props: PageProps<"/programme-electoral/engagements/[slug]">) {
  const { slug } = await props.params;
  if (!commitmentsMeta.some((item) => item.slug === slug)) notFound();
  const source = await getCommitmentSource(slug as CommitmentSlug);
  return <ProgramDetailPage kind="commitment" slug={slug as CommitmentSlug} source={source} />;
}
