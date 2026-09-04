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
import type { CategorySlug } from "@/lib/i18n/types";

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

export const programPdfPath = "/documents/programme-electoral-uc.pdf";
