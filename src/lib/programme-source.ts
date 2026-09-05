import type { CategorySlug, CommitmentSlug } from "./i18n/types";

// Exact chat.md heading boundaries, inclusive start / exclusive end.
// Cross-sector sections intentionally belong to more than one site theme.
export const axisSourceRanges = {
  economie: [["الالتزام الوطني الأول: اقتصاد منتج، فرص شغل أكثر، وقدرة شرائية أقوى", "الالتزام الوطني الثاني: دولة الإنصاف والحماية الاجتماعية"]],
  "tashghil-chabab": [
    ["أولا: التشغيل في قلب السياسة الاقتصادية", "ثانيا: حماية القدرة الشرائية ومواجهة غلاء المعيشة"],
    ["خامسا: توسيع الولوج إلى التمويل وتحديث المنظومات المالية", "سادسا: سياسة صناعية منتجة قائمة على القيمة المضافة والابتكار"],
    ["رابعا: السياسات الشبابية", "خامسا: الثقافة والهوية"],
  ],
  "taalim-takwin": [["أولا: إصلاح المنظومة التعليمية وبناء رأسمال بشري تنافسي", "ثالثا: إصلاح المنظومة الصحية وبناء رأسمال صحي وطني"]],
  sante: [["ثالثا: إصلاح المنظومة الصحية وبناء رأسمال صحي وطني", "رابعا: حماية اجتماعية قائمة على التمكين والإنصاف"]],
  "adala-ijtimaiya": [
    ["الالتزام الوطني الثاني: دولة الإنصاف والحماية الاجتماعية", "أولا: إصلاح المنظومة التعليمية وبناء رأسمال بشري تنافسي"],
    ["رابعا: حماية اجتماعية قائمة على التمكين والإنصاف", "الالتزام الوطني الثالث: مغرب الجهات والعدالة المجالية"],
    ["ثالثا: المرأة والأسرة", "رابعا: السياسات الشبابية"],
  ],
  "tanmia-majaliya": [["الالتزام الوطني الثالث: مغرب الجهات والعدالة المجالية", "الالتزام الوطني الرابع: مغرب الثقة والإشعاع"]],
  "raqmana-ibtikar": [
    ["أولا: التحول الرقمي", "ثانيا: الماء والبيئة والتنمية المستدامة"],
    ["ثانيا: جعل الجامعة المغربية رافعة للتنمية", "ثالثا: إصلاح المنظومة الصحية وبناء رأسمال صحي وطني"],
  ],
  "bia-tanmia-moustadama": [
    ["ثانيا: الماء والبيئة والتنمية المستدامة", "ثالثا: المرأة والأسرة"],
    ["ثامنا: تسريع الانتقال الطاقي وتعزيز الأمن الطاقي", "تاسعا: إدماج القطاع غير المهيكل وفق خصوصية كل فئة"],
    ["حادي عشر: اقتصاد مستدام يستثمر في موارده وقطاعات المستقبل", "ثاني عشر: الحفاظ على التوازنات الاقتصادية والمالية"],
    ["المغرب في مواجهة التحديات والأزمات", "الحكامة والتنفيذ"],
  ],
  "hakama-idara": [
    ["الالتزام الوطني الرابع: مغرب الثقة والإشعاع", "السياسات القطاعية الداعمة"],
    ["الحكامة والتنفيذ", "خاتمة سياسية"],
  ],
  "thaqafa-riyada": [["خامسا: الثقافة والهوية", "خاتمة السياسات القطاعية"]],
} satisfies Record<CategorySlug, [string, string][]>;

// Each national commitment is one complete chapter, including its introduction
// and conclusion. The following chapter's heading is the exclusive boundary.
export const commitmentSourceRanges = {
  "productive-economy": [["الالتزام الوطني الأول: اقتصاد منتج، فرص شغل أكثر، وقدرة شرائية أقوى", "الالتزام الوطني الثاني: دولة الإنصاف والحماية الاجتماعية"]],
  "social-equity": [["الالتزام الوطني الثاني: دولة الإنصاف والحماية الاجتماعية", "الالتزام الوطني الثالث: مغرب الجهات والعدالة المجالية"]],
  "regional-justice": [["الالتزام الوطني الثالث: مغرب الجهات والعدالة المجالية", "الالتزام الوطني الرابع: مغرب الثقة والإشعاع"]],
  "trust-and-influence": [["الالتزام الوطني الرابع: مغرب الثقة والإشعاع", "السياسات القطاعية الداعمة"]],
} satisfies Record<CommitmentSlug, [string, string][]>;

export type SourceBlock =
  | { kind: "heading" | "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "numbered"; number: number; text: string; items: string[] };
export type ProgramSource = { language: "ar"; blocks: SourceBlock[] };

export function parseSourceBlocks(markdown: string): SourceBlock[] {
  const blocks: SourceBlock[] = [];
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim().replace(/\\$/, "").trimEnd();
    if (!line) continue;
    const heading = /^\*\*(.+)\*\*$/.exec(line);
    const numbered = /^(\d+)\.\s+(.+)$/.exec(line);
    const bullet = /^•\s*(.+)$/.exec(line);
    const previous = blocks.at(-1);
    if (heading) blocks.push({ kind: "heading", text: heading[1] });
    else if (numbered) blocks.push({ kind: "numbered", number: Number(numbered[1]), text: numbered[2], items: [] });
    else if (bullet) {
      if (previous?.kind === "list" || previous?.kind === "numbered") previous.items.push(bullet[1]);
      else blocks.push({ kind: "list", items: [bullet[1]] });
    } else blocks.push({ kind: "paragraph", text: line });
  }
  return blocks;
}

function extractSource(markdown: string, ranges: [string, string][], slug: string): ProgramSource {
  const headings = [...markdown.matchAll(/^\*\*(.+?)\*\*\\?\r?$/gm)];
  const boundary = (title: string) => {
    const matches = headings.filter((heading) => heading[1] === title);
    if (matches.length !== 1) throw new Error(`Expected one chat.md heading: ${title}`);
    return matches[0].index;
  };
  const blocks = ranges.flatMap(([start, end]) => {
    const from = boundary(start);
    const to = boundary(end);
    if (to <= from) throw new Error(`Invalid chat.md range for ${slug}`);
    return parseSourceBlocks(markdown.slice(from, to));
  });
  if (!blocks.length) throw new Error(`Empty chat.md content for ${slug}`);
  return { language: "ar", blocks };
}

export function extractAxisSource(markdown: string, slug: CategorySlug): ProgramSource {
  return extractSource(markdown, axisSourceRanges[slug], slug);
}

export function extractCommitmentSource(markdown: string, slug: CommitmentSlug): ProgramSource {
  return extractSource(markdown, commitmentSourceRanges[slug], slug);
}
