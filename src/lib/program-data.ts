import {
  Briefcase,
  GraduationCap,
  HeartPulse,
  Scale,
  MapPinned,
  Cpu,
  Leaf,
  Landmark,
  Palette,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { CategorySlug, CommitmentSlug } from "@/lib/i18n/types";

export type CategoryMeta = {
  slug: CategorySlug;
  icon: LucideIcon;
};

export const categoriesMeta: CategoryMeta[] = [
  { slug: "economie", icon: TrendingUp },
  { slug: "tashghil-chabab", icon: Briefcase },
  { slug: "taalim-takwin", icon: GraduationCap },
  { slug: "sante", icon: HeartPulse },
  { slug: "adala-ijtimaiya", icon: Scale },
  { slug: "tanmia-majaliya", icon: MapPinned },
  { slug: "raqmana-ibtikar", icon: Cpu },
  { slug: "bia-tanmia-moustadama", icon: Leaf },
  { slug: "hakama-idara", icon: Landmark },
  { slug: "thaqafa-riyada", icon: Palette },
];

export type CommitmentMeta = {
  slug: CommitmentSlug;
  relatedAxes: CategorySlug[];
};

export const commitmentsMeta: CommitmentMeta[] = [
  { slug: "productive-economy", relatedAxes: ["economie", "tashghil-chabab"] },
  { slug: "social-equity", relatedAxes: ["taalim-takwin", "sante", "adala-ijtimaiya"] },
  { slug: "regional-justice", relatedAxes: ["tanmia-majaliya", "bia-tanmia-moustadama"] },
  { slug: "trust-and-influence", relatedAxes: ["raqmana-ibtikar", "hakama-idara", "thaqafa-riyada"] },
];

export const programPdfPath = "/documents/programme-electoral-uc.pdf";
