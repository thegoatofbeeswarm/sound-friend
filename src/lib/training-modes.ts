/**
 * Training categories. Each mode generates rounds of a different listening
 * skill, all synthesized in the browser with the Web Audio API (plus speech
 * synthesis for the speech-based modes).
 *
 * A mode's difficulty argument is the shared 1..10 trainer level.
 */

import { getAudioContext } from "@/lib/audiometry";
import { playSoundscape, SOUNDSCAPES, levelToDb } from "@/lib/soundscapes";

export type ModeId =
  | "soundscape"
  | "speech-in-noise"
  | "high-frequency"
  | "localization"
  | "frequency-discrimination"
  | "conversation"
  | "rapid-speech";

export interface ModeOption {
  id: string;
  label: string;
  hint?: string;
}

export interface ModeRound {
  prompt: string;
  options: ModeOption[];
  answerId: string;
  /** Plays the stimulus. Resolves when playback finishes. */
  play: () => Promise<void>;
}

export interface TrainingMode {
  id: ModeId;
  label: string;
  blurb: string;
  skill: string;
  /** lucide icon name used by the UI. */
  icon: "waves" | "messages" | "sparkles" | "compass" | "music" | "users" | "gauge";
  needsSpeech: boolean;
  makeRound: (level: number, ceilingDb: number) => ModeRound;
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

/**
 * Recently used items per bank, so a round rarely repeats what you just heard.
 * Remembers roughly half a bank (capped) before allowing a repeat.
 */
const recent = new Map<string, unknown[]>();

function pickFresh<T>(key: string, arr: readonly T[]): T {
  if (arr.length <= 1) return arr[0] as T;
  const seen = (recent.get(key) ?? []) as T[];
  const fresh = arr.filter((x) => !seen.includes(x));
  const chosen = pick(fresh.length ? fresh : arr);
  const memory = Math.min(12, Math.max(1, Math.floor(arr.length / 2)));
  recent.set(key, [chosen, ...seen.filter((x) => x !== chosen)].slice(0, memory));
  return chosen;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}


function gainFor(levelDb: number): number {
  const clamped = Math.max(0, Math.min(90, levelDb));
  return Math.max(0.0008, 0.28 * Math.pow(10, (clamped - 90) / 22));
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Speech synthesis with a rate and volume, resolving when it stops. */
async function speak(text: string, rate: number, volume: number): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    await wait(900);
    return;
  }
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.volume = Math.max(0.05, Math.min(1, volume));
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    // Safety net in case the engine never fires onend.
    setTimeout(resolve, 6000);
  });
}

/** A steady band of noise, used as a masker or as a fricative burst. */
async function noiseBurst(opts: {
  ms: number;
  type: BiquadFilterType;
  freq: number;
  q: number;
  gain: number;
  pan?: number;
}): Promise<void> {
  const ctx = await getAudioContext();
  const dur = opts.ms / 1000;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = opts.type;
  filter.frequency.value = opts.freq;
  filter.Q.value = opts.q;
  const g = ctx.createGain();
  const now = ctx.currentTime + 0.02;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0005, opts.gain), now + 0.02);
  g.gain.setValueAtTime(Math.max(0.0005, opts.gain), now + dur - 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  const pan = ctx.createStereoPanner();
  pan.pan.value = opts.pan ?? 0;
  src.connect(filter).connect(g).connect(pan).connect(ctx.destination);
  src.start(now);
  src.stop(now + dur + 0.05);
  await wait(opts.ms + 120);
}

/** A pure tone with optional pan. */
async function tone(freq: number, ms: number, gain: number, pan = 0): Promise<void> {
  const ctx = await getAudioContext();
  const dur = ms / 1000;
  const now = ctx.currentTime + 0.02;
  const osc = ctx.createOscillator();
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0005, gain), now + 0.03);
  g.gain.setValueAtTime(Math.max(0.0005, gain), now + dur - 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  osc.connect(g).connect(p).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.05);
  await wait(ms + 100);
}

/** Looping background babble for the speech modes. Returns a stop function. */
async function startBabble(gain: number): Promise<() => void> {
  const ctx = await getAudioContext();
  const len = Math.floor(ctx.sampleRate * 2);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = 0.9 * last + 0.1 * w;
    d[i] = last * 3;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.value = Math.max(0.0005, gain);
  // Slow modulation makes it sound like a room of voices rather than hiss.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 3.6;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = g.gain.value * 0.5;
  lfo.connect(lfoGain).connect(g.gain);
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start();
  lfo.start();
  return () => {
    try {
      src.stop();
      lfo.stop();
    } catch {
      /* already stopped */
    }
  };
}

/* ------------------------------------------------------------------ */
/* word banks                                                          */
/* ------------------------------------------------------------------ */

const WORDS = [
  "boat", "coat", "goat", "note",
  "seat", "feet", "heat", "beat",
  "pin", "thin", "fin", "shin",
  "cap", "cat", "cab", "can",
  "rice", "rise", "ride", "ripe",
  "mask", "mast", "match", "map",
];

const SENTENCES: Array<{ text: string; question: string; options: string[]; answer: string }> = [
  {
    text: "The meeting moved to Thursday morning.",
    question: "Which day was mentioned?",
    options: ["Tuesday", "Thursday", "Saturday", "Sunday"],
    answer: "Thursday",
  },
  {
    text: "She left the keys on the kitchen table.",
    question: "Where were the keys left?",
    options: ["Kitchen table", "Front door", "Car seat", "Bedside drawer"],
    answer: "Kitchen table",
  },
  {
    text: "Take the second exit and turn right at the lights.",
    question: "Which exit?",
    options: ["First", "Second", "Third", "Fourth"],
    answer: "Second",
  },
  {
    text: "The train to Bristol leaves from platform nine.",
    question: "Which platform?",
    options: ["Platform five", "Platform nine", "Platform one", "Platform seven"],
    answer: "Platform nine",
  },
  {
    text: "I ordered the soup instead of the salad.",
    question: "What was ordered?",
    options: ["Soup", "Salad", "Sandwich", "Steak"],
    answer: "Soup",
  },
  {
    text: "He said the price went up by fifteen percent.",
    question: "By how much?",
    options: ["Five percent", "Fifteen percent", "Fifty percent", "Thirteen percent"],
    answer: "Fifteen percent",
  },
];

/** Fricatives are the first thing to go with high-frequency loss. */
const FRICATIVES = [
  { id: "s", label: "S  (sss)", freq: 6500, q: 1.4 },
  { id: "sh", label: "SH  (shh)", freq: 3000, q: 1.2 },
  { id: "f", label: "F  (fff)", freq: 8000, q: 0.8 },
  { id: "th", label: "TH  (thh)", freq: 5200, q: 0.7 },
];

/* ------------------------------------------------------------------ */
/* modes                                                               */
/* ------------------------------------------------------------------ */

export const TRAINING_MODES: TrainingMode[] = [
  {
    id: "soundscape",
    label: "Everyday sounds",
    blurb: "Identify real-world sounds as they get quieter and quieter.",
    skill: "Detection threshold",
    icon: "waves",
    needsSpeech: false,
    makeRound: (level, ceiling) => {
      const target = pick(SOUNDSCAPES);
      const choices = level >= 8 ? 5 : level >= 5 ? 4 : 3;
      const spread = level >= 6 ? 25 : 60;
      const near = SOUNDSCAPES.filter(
        (s) => s.id !== target.id && Math.abs(s.realDb - target.realDb) <= spread,
      );
      const pool = near.length >= choices - 1 ? near : SOUNDSCAPES.filter((s) => s.id !== target.id);
      const distractors = shuffle(pool).slice(0, choices - 1);
      const levelDb = levelToDb(level, ceiling);
      return {
        prompt: "What did you hear?",
        options: shuffle([target, ...distractors]).map((s) => ({ id: s.id, label: s.label })),
        answerId: target.id,
        play: () => playSoundscape(target.id, levelDb),
      };
    },
  },
  {
    id: "speech-in-noise",
    label: "Speech in noise",
    blurb: "Understand single words spoken over cafe and classroom babble.",
    skill: "Signal-to-noise ratio",
    icon: "messages",
    needsSpeech: true,
    makeRound: (level) => {
      const answer = pick(WORDS);
      const distractors = shuffle(WORDS.filter((w) => w !== answer)).slice(0, level >= 6 ? 3 : 2);
      // Higher level = louder babble relative to speech.
      const babble = 0.02 + (level / 10) * 0.12;
      return {
        prompt: "Which word was spoken?",
        options: shuffle([answer, ...distractors]).map((w) => ({ id: w, label: w })),
        answerId: answer,
        play: async () => {
          const stop = await startBabble(babble);
          await wait(500);
          await speak(answer, 0.95, Math.max(0.25, 1 - level * 0.05));
          await wait(300);
          stop();
        },
      };
    },
  },
  {
    id: "high-frequency",
    label: "High-frequency recognition",
    blurb: "Tell apart S, F, TH and SH — the sounds that fade first.",
    skill: "3-8 kHz resolution",
    icon: "sparkles",
    needsSpeech: false,
    makeRound: (level) => {
      const target = pick(FRICATIVES);
      const gain = gainFor(70 - level * 4);
      return {
        prompt: "Which sound was that?",
        options: shuffle(FRICATIVES).map((f) => ({ id: f.id, label: f.label })),
        answerId: target.id,
        play: () =>
          noiseBurst({
            ms: level >= 7 ? 180 : 320,
            type: "bandpass",
            freq: target.freq,
            q: target.q,
            gain,
          }),
      };
    },
  },
  {
    id: "localization",
    label: "Sound localization",
    blurb: "Say where a sound came from. Needs stereo headphones.",
    skill: "Binaural balance",
    icon: "compass",
    needsSpeech: false,
    makeRound: (level) => {
      // Higher level = smaller left/right offsets.
      const spread = Math.max(0.15, 1 - level * 0.085);
      const positions = [
        { id: "left", label: "Left", pan: -spread },
        { id: "centre-left", label: "Slightly left", pan: -spread / 2.5 },
        { id: "centre", label: "Centre", pan: 0 },
        { id: "centre-right", label: "Slightly right", pan: spread / 2.5 },
        { id: "right", label: "Right", pan: spread },
      ];
      const pool = level >= 5 ? positions : positions.filter((p) => p.id.indexOf("centre-") !== 0);
      const target = pick(pool);
      return {
        prompt: "Where did it come from?",
        options: pool.map((p) => ({ id: p.id, label: p.label })),
        answerId: target.id,
        play: () =>
          noiseBurst({
            ms: 420,
            type: "bandpass",
            freq: 1800,
            q: 0.9,
            gain: gainFor(62),
            pan: target.pan,
          }),
      };
    },
  },
  {
    id: "frequency-discrimination",
    label: "Frequency discrimination",
    blurb: "Two tones play. Decide whether the second is higher, lower or the same.",
    skill: "Pitch resolution",
    icon: "music",
    needsSpeech: false,
    makeRound: (level) => {
      const base = pick([500, 1000, 2000, 4000]);
      // Higher level = smaller pitch difference (down to ~0.5%).
      const pct = Math.max(0.005, 0.09 - level * 0.0085);
      const direction = pick(["higher", "lower", "same"] as const);
      const second =
        direction === "same" ? base : direction === "higher" ? base * (1 + pct) : base * (1 - pct);
      const gain = gainFor(62);
      return {
        prompt: "Was the second tone higher, lower, or the same?",
        options: [
          { id: "higher", label: "Higher" },
          { id: "same", label: "The same" },
          { id: "lower", label: "Lower" },
        ],
        answerId: direction,
        play: async () => {
          await tone(base, 420, gain);
          await wait(220);
          await tone(second, 420, gain);
        },
      };
    },
  },
  {
    id: "conversation",
    label: "Conversation simulation",
    blurb: "Follow a full sentence with background noise, then answer a question.",
    skill: "Working memory in noise",
    icon: "users",
    needsSpeech: true,
    makeRound: (level) => {
      const item = pick(SENTENCES);
      const babble = 0.02 + (level / 10) * 0.1;
      return {
        prompt: item.question,
        options: shuffle(item.options).map((o) => ({ id: o, label: o })),
        answerId: item.answer,
        play: async () => {
          const stop = await startBabble(babble);
          await wait(500);
          await speak(item.text, 1, Math.max(0.3, 1 - level * 0.045));
          await wait(300);
          stop();
        },
      };
    },
  },
  {
    id: "rapid-speech",
    label: "Rapid speech",
    blurb: "Keep up when the speaker talks fast. No background noise.",
    skill: "Temporal processing",
    icon: "gauge",
    needsSpeech: true,
    makeRound: (level) => {
      const item = pick(SENTENCES);
      const rate = 1.2 + level * 0.13; // up to ~2.5x
      return {
        prompt: item.question,
        options: shuffle(item.options).map((o) => ({ id: o, label: o })),
        answerId: item.answer,
        play: async () => {
          await speak(item.text, rate, 1);
        },
      };
    },
  },
];

export function modeById(id: string): TrainingMode {
  return TRAINING_MODES.find((m) => m.id === id) ?? (TRAINING_MODES[0] as TrainingMode);
}
