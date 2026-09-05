import { getAxisSource } from "@/lib/programme-source.server";
import { notFound } from "next/navigation";
import { ProgramDetailPage } from "@/components/programme/program-detail-page";
import { categoriesMeta } from "@/lib/program-data";
import type { CategorySlug } from "@/lib/i18n";

export function generateStaticParams() {
  return categoriesMeta.map(({ slug }) => ({ slug }));
}

export default async function AxisDetailPage(props: PageProps<"/programme-electoral/axes/[slug]">) {
  const { slug } = await props.params;
  if (!categoriesMeta.some((item) => item.slug === slug)) notFound();
  const source = await getAxisSource(slug as CategorySlug);
  return <ProgramDetailPage kind="axis" slug={slug as CategorySlug} source={source} />;
}
