export function smoothScrollToId(id: string, options?: { highlight?: boolean }) {
  const el = document.getElementById(id);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "start" });

  if (options?.highlight) {
    el.classList.add("scroll-highlight");
    window.setTimeout(() => el.classList.remove("scroll-highlight"), 1200);
  }
}
