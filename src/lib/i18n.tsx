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

  "home.badge": "为耳机世代打造的聆听健康平台",
  "home.title1": "你的听力没问题，",
  "home.title2": "但在嘈杂的酒吧里你还听得清对话吗？",
  "home.lead":
    "Audiomaxxer 关注的是人们真正困扰的问题：在噪声环境中听清别人说话。一次简短的筛查会评估你的噪声中言语能力，以及灵敏度、声音辨别、注意力与记忆，然后训练最弱的一项。",
  "home.ctaTest": "开始筛查",
  "home.ctaHistory": "查看已保存结果",
  "home.disclaimer":
    "需要佩戴耳机。本结果不构成医学诊断。如需更准确的结果，请到当地诊所或听力检测室进行筛查。",
  "home.pillarsTitle": "它有什么不同？",

  "pillar.adaptive.title": "自适应",
  "pillar.adaptive.body": "贝叶斯阶梯法会在每次回答后更新对你听阈的判断。",
  "pillar.prefs.title": "个性化训练",
  "pillar.prefs.body": "你表现最弱的聆听维度决定 Audiomaxxer 接下来优先安排哪些练习。",
  "pillar.env.title": "环境感知",
  "pillar.env.body": "麦克风会估算房间噪音，只有在足够安静时筛查结果才被采信。",
  "pillar.access.title": "基于浏览器",
  "pillar.access.body": "在配有耳机的现代手机和电脑上即可使用，无需专用设备。",
  "pillar.coach.title": "聆听教练",
  "pillar.coach.body": "结合你自己的结果进行对话，解释这些数据的含义以及下一步该练什么。",
  "pillar.training.title": "真实场景聆听练习",
  "pillar.training.body": "以难度逐步提升的任务练习噪声中的言语、声音辨别、注意力与听觉记忆。",

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

  "home.badge": "Salud auditiva para la generación de los auriculares",
  "home.title1": "Oyes bien,",
  "home.title2": "¿pero puedes seguir una conversación en un bar ruidoso?",
  "home.lead":
    "Audiomaxxer mide lo que de verdad cuesta: entender el habla cuando hay ruido alrededor. Un cribado corto puntúa tu habla con ruido junto a sensibilidad, discriminación, atención y memoria, y luego entrena tu punto más débil.",
  "home.ctaTest": "Comenzar un cribado",
  "home.ctaHistory": "Ver resultados guardados",
  "home.disclaimer":
    "Se requieren auriculares. Esto no es un diagnóstico médico. Para mayor precisión, hazte un cribado auditivo en tu clínica o cabina local.",
  "home.pillarsTitle": "¿Qué lo hace diferente?",

  "pillar.adaptive.title": "Adaptativo",
  "pillar.adaptive.body": "Una escalera bayesiana actualiza su estimación tras cada respuesta.",
  "pillar.prefs.title": "Entrenamiento personalizado",
  "pillar.prefs.body":
    "Tu dimensión de escucha más baja determina qué ejercicios prioriza Audiomaxxer a continuación.",
  "pillar.env.title": "Conciencia del entorno",
  "pillar.env.body":
    "El micrófono estima el ruido de la sala, así que un cribado solo se considera fiable cuando el espacio está lo bastante silencioso.",
  "pillar.access.title": "Basado en el navegador",
  "pillar.access.body":
    "Funciona en teléfonos y ordenadores modernos con auriculares, sin equipo especializado.",
  "pillar.coach.title": "Entrenador de escucha",
  "pillar.coach.body": "Un chat guiado que lee tus resultados y explica qué significan y qué practicar después.",
  "pillar.training.title": "Ejercicios de escucha reales",
  "pillar.training.body":
    "Practica habla con ruido, discriminación, atención y memoria auditiva con tareas cada vez más difíciles.",

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
  sciencePack,
  teamPage,
  speechPage,
  profilePage,
  planPack,
  loopPack,
  navPack,
  platformPack,
  researchPack,
  youthPack,
  heroPack,
];


function merge(lang: Language, base: Record<string, string>): Record<string, string> {
  return Object.assign({}, base, ...packs.map((p) => p[lang]));
}

const bases: Record<Language, Record<string, string>> = { en, zh, es };
const built: Partial<Record<Language, Record<string, string>>> = {};

/** Build a language's dictionary the first time it is actually used. */
function dictionary(lang: Language): Record<string, string> {
  return (built[lang] ??= merge(lang, bases[lang]!));
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

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: string) => dictionary(language)[key] ?? dictionary("en")[key] ?? key,
    }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
