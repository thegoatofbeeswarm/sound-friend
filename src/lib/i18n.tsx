import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "zh" | "es";

export const LANGUAGES: { value: Language; label: string; short: string }[] = [
  { value: "en", label: "English", short: "EN" },
  { value: "zh", label: "中文", short: "中文" },
  { value: "es", label: "Español", short: "ES" },
];

const STORAGE_KEY = "audiomaxxer.lang";

const en = {
  "nav.test": "Hearing test",
  "nav.train": "Train",
  "nav.risks": "Risks",
  "nav.history": "History",
  "nav.signIn": "Sign in",
  "nav.signOut": "Sign out",
  "nav.theme": "Theme",
  "nav.language": "Language",
  "nav.light": "Light",
  "nav.dark": "Dark",

  "home.badge": "Listening health for the headphone generation",
  "home.title1": "You can hear fine,",
  "home.title2": "but can you follow a conversation in a loud bar?",
  "home.lead":
    "Studies show that 12~17% of teens are affected by unnoticed hearing-related problems. Not being able to follow a conversation in a noisy area is a sign of this. To combat rapid hearing loss, Audiomaxxer uses a screening test to build a five-part listening profile — sensitivity, speech in noise, discrimination, attention, and memory — then trains your weakest skill and retests it.",
  "home.ctaTest": "Start a screening",
  "home.ctaHistory": "See saved results",
  "home.disclaimer":
    "Headphones required. This is not a medical diagnosis. For more accuracy, do a hearing screening at your local clinic/booth.",
  "home.pillarsTitle": "What's different about this?",

  "pillar.adaptive.title": "Adaptive",
  "pillar.adaptive.body": "A Bayesian staircase updates its belief after every response.",
  "pillar.prefs.title": "Personalized training",
  "pillar.prefs.body":
    "Your lowest-performing listening dimension decides which exercises Audiomaxxer prioritizes next.",
  "pillar.env.title": "Environmental awareness",
  "pillar.env.body":
    "The microphone estimates room noise so a screening is only trusted when the space is quiet enough.",
  "pillar.access.title": "Browser-based",
  "pillar.access.body":
    "Works on modern phones and computers with headphones. You don't need any dedicated equipment.",
  "pillar.coach.title": "Listening coach",
  "pillar.coach.body": "A guided chat that reads your own results and explains what they mean and what to practise next.",
  "pillar.training.title": "Real-world listening exercises",
  "pillar.training.body":
    "Practise speech in noise, sound discrimination, attention and auditory memory with increasingly difficult listening tasks.",

  "stats.people": "people live with hearing loss worldwide",
  "stats.tracks": "frequency-and-ear tracks measured per screening",
  "stats.timeValue": "~4 min",
  "stats.time": "typical adaptive screening time",
  "studies.title": "Hearing loss in adolescents: current research",
  "studies.desc":
    "A short reading list on why teenage and young-adult hearing is the fastest-growing part of that 1.5 billion.",
  "footer.note":
    "Results stay in your private account. Screening only - see a clinician for diagnosis.",
} as const;

export type TranslationKey = keyof typeof en;



import { charts } from "@/lib/i18n-dicts/charts";
import { common } from "@/lib/i18n-dicts/common";
import { testPage } from "@/lib/i18n-dicts/test";
import { trainPage } from "@/lib/i18n-dicts/train";
import { historyPage } from "@/lib/i18n-dicts/history";
import { risksPage } from "@/lib/i18n-dicts/risks";
import { reportPage } from "@/lib/i18n-dicts/report";
import { dataPage } from "@/lib/i18n-dicts/data";
import { coachPage } from "@/lib/i18n-dicts/coach";
import { sciencePack } from "@/lib/i18n-dicts/science";
import { teamPage } from "@/lib/i18n-dicts/team";
import { profilePage } from "@/lib/i18n-dicts/profile";
import { speechPage } from "@/lib/i18n-dicts/speech";
import { planPack } from "@/lib/i18n-dicts/plan";
import { loopPack } from "@/lib/i18n-dicts/loop";
import { navPack } from "@/lib/i18n-dicts/nav";
import { platformPack } from "@/lib/i18n-dicts/platform";
import { researchPack } from "@/lib/i18n-dicts/research";
import { youthPack } from "@/lib/i18n-dicts/youth";
import { heroPack } from "@/lib/i18n-dicts/hero";
import { pathwayPack } from "@/lib/i18n-dicts/pathway";

/** English is bundled; it is also the fallback for any missing key. */
const englishPacks: Record<string, string>[] = [
  charts,
  common,
  testPage,
  trainPage,
  historyPage,
  risksPage,
  reportPage,
  dataPage,
  coachPage,
  sciencePack,
  teamPage,
  profilePage,
  speechPage,
  planPack,
  loopPack,
  navPack,
  platformPack,
  researchPack,
  youthPack,
  heroPack,
  pathwayPack,
];

/**
 * Chinese and Spanish load only when someone picks them, so English readers
 * never download them. Packs merge in the same order as the English ones
 * (a few keys appear in two packs and the later one wins), after _base.
 */
const PACK_ORDER = ["_base", "charts", "common", "test", "train", "history", "risks", "report", "data", "coach", "science", "team", "profile", "speech", "plan", "loop", "nav", "platform", "research", "youth", "hero", "pathway"];

type Loader = () => Promise<{ default: Record<string, string> }>;
const lazyPacks: Record<Exclude<Language, "en">, Record<string, Loader>> = {
  zh: import.meta.glob<{ default: Record<string, string> }>("./i18n-dicts/zh/*.ts"),
  es: import.meta.glob<{ default: Record<string, string> }>("./i18n-dicts/es/*.ts"),
};

const built: Partial<Record<Language, Record<string, string>>> = {
  en: Object.assign({}, en, ...englishPacks),
};

const packName = (path: string) => path.split("/").pop()!.replace(/\.ts$/, "");

/** Fetch and merge a language's strings once; English is always ready. */
async function loadLanguage(lang: Language): Promise<void> {
  if (lang === "en" || built[lang]) return;
  const loaders = Object.entries(lazyPacks[lang]).sort(
    ([a], [b]) => PACK_ORDER.indexOf(packName(a)) - PACK_ORDER.indexOf(packName(b)),
  );
  const mods = await Promise.all(loaders.map(([, load]) => load()));
  built[lang] = Object.assign({}, ...mods.map((m) => m.default));
}

type I18nContextValue = {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (key) => (en as Record<string, string>)[key] ?? key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === "en" || stored === "zh" || stored === "es") {
      setLanguageState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
    if (typeof document !== "undefined") document.documentElement.lang = l;
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  // Bumped when a language finishes loading, so strings swap in without a reload.
  const [loaded, setLoaded] = useState(0);
  useEffect(() => {
    if (built[language]) return;
    let cancelled = false;
    void loadLanguage(language)
      .then(() => {
        if (!cancelled) setLoaded((n) => n + 1);
      })
      .catch(() => {
        /* offline or blocked: English stays in place */
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: string) => built[language]?.[key] ?? built.en![key] ?? key,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language, setLanguage, loaded],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
