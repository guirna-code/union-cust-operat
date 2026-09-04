export type Locale = "ar" | "fr" | "en";

export type CategorySlug =
  | "economie"
  | "tashghil-chabab"
  | "taalim-takwin"
  | "sante"
  | "adala-ijtimaiya"
  | "tanmia-majaliya"
  | "raqmana-ibtikar"
  | "bia-tanmia-moustadama"
  | "hakama-idara"
  | "thaqafa-riyada";

export type CategoryContent = {
  title: string;
  description: string;
  points: string[];
};

export type Dictionary = {
  locale: Locale;
  dir: "rtl" | "ltr";
  htmlLang: string;

  meta: {
    homeTitle: string;
    homeDescription: string;
    programmeTitle: string;
    programmeDescription: string;
  };

  languageSwitcher: {
    label: string;
    ar: string;
    fr: string;
    en: string;
  };

  header: {
    partyShortBadge: string;
    partyName: string;
    nav: { label: string; href: string }[];
    ctaDiscover: string;
    openMenu: string;
    closeMenu: string;
  };

  footer: {
    tagline: string;
    quickLinksTitle: string;
    quickLinks: { label: string; href: string }[];
    contactTitle: string;
    address: string;
    email: string;
    rights: string;
    programYear: string;
  };

  home: {
    badge: string;
    title: string;
    subtitle: string;
    ctaDiscover: string;
    ctaMoroccoStronger: string;
    aboutEyebrow: string;
    aboutTitle: string;
    aboutDescription: string;
  };

  hero: {
    eyebrow: string;
    title: string;
    slogan: string;
    subtitle: string;
    cta: string;
    ctaMoroccoStronger: string;
  };

  intro: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
  };

  commitmentsSection: {
    eyebrow: string;
    title: string;
    description: string;
    items: { number: string; title: string; description: string }[];
  };

  categoriesSection: {
    eyebrow: string;
    title: string;
    description: string;
    discoverMore: string;
    items: Record<CategorySlug, CategoryContent>;
  };

  detailedSection: {
    eyebrow: string;
    title: string;
    description: string;
  };

  download: {
    title: string;
    description: string;
    cta: string;
  };

  finalCta: {
    title: string;
    lines: string[];
    closing: string;
    contact: string;
    discoverVision: string;
  };

  chatbot: {
    title: string;
    subtitle: string;
    welcome: string;
    placeholder: string;
    send: string;
    open: string;
    close: string;
    emptyQuestion: string;
    fallback: string;
    matchIntro: string;
  };
};
