import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-start",
        className,
      )}
    >
      {eyebrow ? (
        <span className="text-sm font-semibold tracking-wide text-red">{eyebrow}</span>
      ) : null}
      <h2 className="text-3xl font-bold text-ink sm:text-4xl">{title}</h2>
      <span className="h-1 w-16 rounded-full bg-gold" />
      {description ? (
        <p className="max-w-2xl text-base leading-8 text-ink-soft sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}
