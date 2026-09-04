"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { categoriesMeta } from "@/lib/program-data";
import { useLocale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

const categoryKeywords: Record<string, string[]> = {
  economie: [
    "اقتصاد", "استثمار", "مقاول", "ريع", "احتكار", "إنتاج", "صناعة", "فلاحة", "طاقة", "أسعار", "تضخم",
    "économie", "economie", "investissement", "entreprise", "monopole", "prix", "inflation", "industrie",
    "economy", "investment", "business", "monopoly", "inflation", "market", "production", "industry",
  ],
  "tashghil-chabab": [
    "تشغيل", "شغل", "شباب", "بطالة", "عمل", "مقاولة", "مشاريع", "فرص",
    "emploi", "chômage", "chomage", "jeune", "jeunesse", "travail", "entrepreneuriat",
    "employment", "job", "jobs", "youth", "work", "unemployment", "entrepreneur", "hiring",
  ],
  "taalim-takwin": [
    "تعليم", "مدرسة", "تكوين", "جامعة", "بحث علمي", "دكتوراه", "أساتذة", "طلبة",
    "éducation", "education", "école", "ecole", "université", "universite", "recherche", "étudiant",
    "education", "school", "university", "research", "student", "teacher", "academic", "training",
  ],
  sante: [
    "صحة", "مستشفى", "طبيب", "أدوية", "تغطية صحية", "علاج", "دواء", "تمريض", "مرض",
    "santé", "sante", "hôpital", "hopital", "médecin", "médicament", "soin", "amo", "pharmaceutique",
    "health", "healthcare", "hospital", "doctor", "medicine", "pharmaceutical", "care", "clinic",
  ],
  "adala-ijtimaiya": [
    "حماية اجتماعية", "عدالة", "أسرة", "تقاعد", "إعاقة", "سكن", "نقل", "طبقة متوسطة", "هشاشة",
    "social", "famille", "retraite", "handicap", "logement", "transport", "justice", "équité",
    "social", "family", "pension", "disability", "housing", "transport", "equity", "welfare",
  ],
  "tanmia-majaliya": [
    "جهوية", "جهات", "عالم قروي", "قرية", "جبل", "واحات", "طرق", "عزلة", "تراب",
    "région", "region", "rural", "territoire", "montagne", "désenclavement", "village",
    "region", "regional", "rural", "territory", "mountain", "village", "decentralization",
  ],
  "raqmana-ibtikar": [
    "رقمنة", "رقمي", "ذكاء اصطناعي", "أمن سيبراني", "تكنولوجيا", "بيانات",
    "numérique", "numerique", "digital", "ia", "intelligence artificielle", "cybersécurité", "technologie",
    "digital", "ai", "artificial intelligence", "cybersecurity", "tech", "data",
  ],
  "bia-tanmia-moustadama": [
    "ماء", "مياه", "بيئة", "مناخ", "جفاف", "تحلية", "كوارث", "طاقة متجددة", "سدود",
    "eau", "environnement", "climat", "sécheresse", "dessalement", "catastrophe", "durable",
    "water", "environment", "climate", "drought", "desalination", "disaster", "green", "sustainable",
  ],
  "hakama-idara": [
    "حكامة", "إدارة", "مسؤولية", "محاسبة", "قضاء", "عدالة", "نزاهة", "فساد", "شفافية",
    "gouvernance", "administration", "justice", "transparence", "corruption", "droit", "responsabilité",
    "governance", "administration", "judiciary", "justice", "transparency", "corruption", "law",
  ],
  "thaqafa-riyada": [
    "ثقافة", "رياضة", "إعلام", "صحافة", "مغاربة العالم", "هوية", "تراث", "مهاجر",
    "culture", "sport", "sports", "mre", "média", "presse", "patrimoine", "diaspora",
    "culture", "sport", "sports", "diaspora", "media", "press", "heritage", "identity",
  ],
};

function getBotReply(question: string, t: Dictionary): string {
  const normalized = question.trim().toLowerCase();
  if (!normalized) {
    return t.chatbot.emptyQuestion;
  }

  // 1. Check direct commitments question
  const isAskingCommitment =
    normalized.includes("التزام") ||
    normalized.includes("engagement") ||
    normalized.includes("commitment");

  if (isAskingCommitment) {
    const list = t.commitmentsSection.items
      .map((item) => `${item.number}. ${item.title}`)
      .join("\n");
    return `${t.commitmentsSection.title}:\n\n${list}`;
  }

  // 2. Check category keywords and titles
  const match = categoriesMeta
    .map((meta) => {
      const content = t.categoriesSection.items[meta.slug];
      const keywords = categoryKeywords[meta.slug] ?? [];
      const score = keywords.reduce(
        (acc, kw) => (normalized.includes(kw.toLowerCase()) ? acc + 1 : acc),
        0,
      );
      const titleMatch =
        content &&
        (normalized.includes(content.title.toLowerCase()) ||
          content.title
            .toLowerCase()
            .split(" ")
            .some((w) => w.length > 2 && normalized.includes(w)));
      return { meta, content, score: score + (titleMatch ? 2 : 0) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0];

  if (match?.content) {
    return `${match.content.title}\n\n${match.content.description}\n\n${t.chatbot.matchIntro}\n• ${match.content.points
      .slice(0, 3)
      .join("\n• ")}`;
  }

  return t.chatbot.fallback;
}

export function ChatbotWidget() {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "bot", text: t.chatbot.welcome },
  ]);
  const [value, setValue] = useState("");
  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Bot answers are generated from the active dictionary. Starting a fresh
    // localized conversation prevents old-language answers from lingering in
    // the interface after a language switch.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronize locale-owned UI state
    setMessages([{ id: "welcome", role: "bot", text: t.chatbot.welcome }]);
    setValue("");
  }, [locale, t.chatbot.welcome]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const question = value.trim();
    if (!question) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text: question };
    const botMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "bot",
      text: getBotReply(question, t),
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setValue("");
  }

  return (
    <>
      {/* Fixed to the physical bottom-right corner regardless of RTL/LTR */}
      <div className="fixed bottom-5 z-50" style={{ right: "1.25rem" }}>
        <AnimatePresence>
          {open ? (
            <motion.div
              id={panelId}
              role="dialog"
              aria-label={`${t.chatbot.title} — ${t.chatbot.subtitle}`}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              dir={t.dir}
              className="mb-4 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
            >
              <div className="flex items-center justify-between bg-ink px-4 py-3 text-surface">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-red text-xs font-bold">
                    {t.header.partyShortBadge}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{t.chatbot.title}</p>
                    <p className="text-[11px] text-surface/60">{t.chatbot.subtitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t.chatbot.close}
                  className="grid h-8 w-8 place-items-center rounded-full text-surface/70 hover:bg-surface/10 hover:text-surface"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-cream px-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    dir="auto"
                    className={cn(
                      "max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-6",
                      message.role === "bot"
                        ? "bg-surface text-ink shadow-sm"
                        : "ms-auto bg-red text-surface",
                    )}
                  >
                    {message.text}
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-line bg-surface p-3"
              >
                <input
                  ref={inputRef}
                  dir="auto"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={t.chatbot.placeholder}
                  className="flex-1 rounded-full border border-line bg-cream px-4 py-2 text-sm outline-none focus:border-red"
                />
                <button
                  type="submit"
                  aria-label={t.chatbot.send}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red text-surface hover:bg-gold"
                >
                  <Send className={cn("h-4 w-4", t.dir === "rtl" && "-scale-x-100")} />
                </button>
              </form>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? t.chatbot.close : t.chatbot.open}
          whileTap={{ scale: 0.92 }}
          className="grid h-14 w-14 place-items-center rounded-full bg-red text-surface shadow-lg shadow-red/30"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="close"
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
              >
                <X className="h-6 w-6" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ opacity: 0, rotate: 45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -45 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}
