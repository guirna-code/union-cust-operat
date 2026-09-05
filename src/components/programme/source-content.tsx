import type { ProgramSource } from "@/lib/programme-source";

const listClass = "list-disc space-y-3 ps-6 text-ink-soft";

export function SourceContent({ source }: { source: ProgramSource }) {
  return (
    <div data-programme-source lang={source.language} dir="rtl" style={{ fontFamily: "var(--font-arabic), sans-serif" }} className="scroll-mt-24 space-y-6 text-start text-base leading-8 [overflow-wrap:anywhere] sm:text-lg">
      {source.blocks.map((block, index) => {
        if (block.kind === "heading") return <h2 key={index} className="mt-10 text-2xl font-bold leading-relaxed text-ink sm:text-3xl">{block.text}</h2>;
        if (block.kind === "paragraph") return <p key={index} className="text-ink-soft">{block.text}</p>;
        if (block.kind === "list") return <ul key={index} className={listClass}>{block.items.map((item, i) => <li key={i}>{item}</li>)}</ul>;
        if (block.kind === "numbered") return (
          <ol key={index} start={block.number} className="list-decimal rounded-2xl border border-line bg-surface py-5 pe-5 ps-12 shadow-sm">
            <li><p className="font-bold text-ink">{block.text}</p>
              {block.items.length > 0 && <ul className={`${listClass} mt-4 font-normal`}>{block.items.map((item, i) => <li key={i}>{item}</li>)}</ul>}
            </li>
          </ol>
        );
      })}
    </div>
  );
}
