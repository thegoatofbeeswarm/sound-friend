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

  "home.badge": "Adaptive audiology for everyone",
  "home.title1": "Protect your hearing.",
  "home.title2": "Spread the awareness.",
  "home.lead":
    "Studies show that 12~17% of teens are affected by hearing-related problems. To raise awareness of screening and train your hearing, use Audiomaxxer, an efficient closed-loop training platform.",
  "home.ctaTest": "Start a screening",
  "home.ctaHistory": "See saved results",
  "home.disclaimer":
    "Headphones required. This is not a medical diagnosis. For more accuracy, do a hearing screening at your local clinic/booth.",
  "home.pillarsTitle": "What's different about this?",

  "pillar.adaptive.title": "Adaptive",
  "pillar.adaptive.body": "A Bayesian staircase updates its belief after every response.",
  "pillar.prefs.title": "Your preferences matter",
  "pillar.prefs.body": "This app is custom-tailored to your needs and preferences",
  "pillar.env.title": "Environmental awareness",
  "pillar.env.body":
    "The microphone estimates room noise so a screening is only trusted when the space is quiet enough.",
  "pillar.access.title": "Accessibility",
  "pillar.access.body": "Runs on any phone with headphones",
  "pillar.coach.title": "AI coach",
  "pillar.coach.body": "AI conversations to help you understand your current problems",
  "pillar.training.title": "Closed-loop training",
  "pillar.training.body":
    "Custom hearing training based off of real life sounds to stimulate and train your hearing",

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

const zh: Record<TranslationKey, string> = {
  "nav.test": "听力测试",
  "nav.train": "训练",
  "nav.risks": "风险",
  "nav.history": "历史记录",
  "nav.signIn": "登录",
  "nav.signOut": "退出登录",
  "nav.theme": "主题",
  "nav.language": "语言",
  "nav.light": "浅色",
  "nav.dark": "深色",

  "home.badge": "人人可用的自适应听力学",
  "home.title1": "保护你的听力。",
  "home.title2": "传播这份意识。",
  "home.lead":
    "研究显示，12%~17% 的青少年受到听力相关问题的影响。为了提高筛查意识并训练你的听力，请使用 Audiomaxxer——全球首个闭环听力训练系统。",
  "home.ctaTest": "开始筛查",
  "home.ctaHistory": "查看已保存结果",
  "home.disclaimer":
    "需要佩戴耳机。本结果不构成医学诊断。如需更准确的结果，请到当地诊所或听力检测室进行筛查。",
  "home.pillarsTitle": "它有什么不同？",

  "pillar.adaptive.title": "自适应",
  "pillar.adaptive.body": "贝叶斯阶梯法会在每次回答后更新对你听阈的判断。",
  "pillar.prefs.title": "你的偏好很重要",
  "pillar.prefs.body": "这款应用会根据你的需求和偏好量身定制。",
  "pillar.env.title": "环境感知",
  "pillar.env.body": "麦克风会估算房间噪音，只有在足够安静时筛查结果才被采信。",
  "pillar.access.title": "无障碍可及",
  "pillar.access.body": "任何一部配有耳机的手机都能使用。",
  "pillar.coach.title": "AI 教练",
  "pillar.coach.body": "通过 AI 对话，帮助你理解当前的听力问题。",
  "pillar.training.title": "闭环训练",
  "pillar.training.body": "基于真实生活声音的定制听力训练，刺激并锻炼你的听觉。",

  "stats.people": "全球有这么多人正与听力损失共处",
  "stats.tracks": "每次筛查测量的频率与耳别组合数",
  "stats.timeValue": "约 4 分钟",
  "stats.time": "一次自适应筛查的典型时长",
  "studies.title": "青少年听力损失：最新研究",
  "studies.desc": "一份简短的阅读清单，说明为何青少年与年轻成人是这 15 亿人中增长最快的群体。",
  "footer.note": "结果仅保存在你的私人账户中。本应用仅供筛查——诊断请咨询临床医生。",
};

const es: Record<TranslationKey, string> = {
  "nav.test": "Prueba auditiva",
  "nav.train": "Entrenar",
  "nav.risks": "Riesgos",
  "nav.history": "Historial",
  "nav.signIn": "Iniciar sesión",
  "nav.signOut": "Cerrar sesión",
  "nav.theme": "Tema",
  "nav.language": "Idioma",
  "nav.light": "Claro",
  "nav.dark": "Oscuro",

  "home.badge": "Audiología adaptativa para todos",
  "home.title1": "Protege tu audición.",
  "home.title2": "Difunde la conciencia.",
  "home.lead":
    "Los estudios muestran que entre el 12 % y el 17 % de los adolescentes tienen problemas relacionados con la audición. Para fomentar el cribado auditivo y entrenar tu oído, usa Audiomaxxer, el primer sistema de entrenamiento de circuito cerrado del mundo.",
  "home.ctaTest": "Comenzar un cribado",
  "home.ctaHistory": "Ver resultados guardados",
  "home.disclaimer":
    "Se requieren auriculares. Esto no es un diagnóstico médico. Para mayor precisión, hazte un cribado auditivo en tu clínica o cabina local.",
  "home.pillarsTitle": "¿Qué lo hace diferente?",

  "pillar.adaptive.title": "Adaptativo",
  "pillar.adaptive.body": "Una escalera bayesiana actualiza su estimación tras cada respuesta.",
  "pillar.prefs.title": "Tus preferencias importan",
  "pillar.prefs.body": "Esta app se adapta a tus necesidades y preferencias.",
  "pillar.env.title": "Conciencia del entorno",
  "pillar.env.body":
    "El micrófono estima el ruido de la sala, así que un cribado solo se considera fiable cuando el espacio está lo bastante silencioso.",
  "pillar.access.title": "Accesibilidad",
  "pillar.access.body": "Funciona en cualquier teléfono con auriculares.",
  "pillar.coach.title": "Entrenador con IA",
  "pillar.coach.body": "Conversaciones con IA para ayudarte a entender tus problemas actuales.",
  "pillar.training.title": "Entrenamiento de circuito cerrado",
  "pillar.training.body":
    "Entrenamiento auditivo personalizado con sonidos de la vida real para estimular y ejercitar tu oído.",

  "stats.people": "personas viven con pérdida auditiva en el mundo",
  "stats.tracks": "combinaciones de frecuencia y oído medidas por cribado",
  "stats.timeValue": "~4 min",
  "stats.time": "duración típica de un cribado adaptativo",
  "studies.title": "Pérdida auditiva en adolescentes: investigación actual",
  "studies.desc":
    "Una breve lista de lecturas sobre por qué la audición de adolescentes y jóvenes adultos es la parte que más rápido crece de esos 1500 millones.",
  "footer.note":
    "Los resultados quedan en tu cuenta privada. Solo cribado: consulta a un profesional para un diagnóstico.",
};

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

export type Dict = { en: Record<string, string>; zh: Record<string, string>; es: Record<string, string> };

const packs: Dict[] = [
  charts,
  common,
  testPage,
  trainPage,
  historyPage,
  risksPage,
  reportPage,
  dataPage,
  coachPage,
];

function merge(lang: Language, base: Record<string, string>): Record<string, string> {
  return Object.assign({}, base, ...packs.map((p) => p[lang]));
}

const dictionaries: Record<Language, Record<string, string>> = {
  en: merge("en", en),
  zh: merge("zh", zh),
  es: merge("es", es),
};

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

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: string) => dictionaries[language][key] ?? dictionaries.en[key] ?? key,
    }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
