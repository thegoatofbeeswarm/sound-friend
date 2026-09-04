/**
 * Real-world soundscape library + adaptive hearing-training engine.
 *
 * Every sound is synthesized in the browser with the Web Audio API and carries
 * the loudness it would have in real life (dB SPL at a typical distance). The
 * trainer presents them attenuated: the harder the level, the quieter and the
 * more crowded the answer set becomes.
 */

import { getAudioContext } from "@/lib/audiometry";

export type SoundId =
  | "breathing"
  | "leaves"
  | "whisper"
  | "fridge"
  | "rain"
  | "conversation"
  | "vacuum"
  | "traffic"
  | "motorcycle"
  | "chainsaw";

export interface Soundscape {
  id: SoundId;
  label: string;
  /** Real-world level in dB SPL. */
  realDb: number;
  hint: string;
}

export const SOUNDSCAPES: Soundscape[] = [
  { id: "breathing", label: "Light breathing", realDb: 10, hint: "Almost silence" },
  { id: "leaves", label: "Rustling leaves", realDb: 20, hint: "A calm garden" },
  { id: "whisper", label: "Whisper", realDb: 30, hint: "Someone close by" },
  { id: "fridge", label: "Fridge hum", realDb: 40, hint: "A quiet kitchen" },
  { id: "rain", label: "Steady rain", realDb: 50, hint: "Outside your window" },
  { id: "conversation", label: "Conversation", realDb: 60, hint: "A cafe table" },
  { id: "vacuum", label: "Vacuum cleaner", realDb: 70, hint: "Housework" },
  { id: "traffic", label: "City traffic", realDb: 80, hint: "A busy street" },
  { id: "motorcycle", label: "Motorcycle", realDb: 95, hint: "Passing at speed" },
  { id: "chainsaw", label: "Chainsaw", realDb: 110, hint: "Hearing damage in minutes" },
];

export function soundById(id: SoundId): Soundscape {
  return SOUNDSCAPES.find((s) => s.id === id)!;
}

/* ------------------------------------------------------------------ */
/* Synthesis                                                           */
/* ------------------------------------------------------------------ */

function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    // Light low-pass to get a browner, more natural noise floor.
    last = 0.96 * last + 0.04 * white;
    d[i] = last * 3.2;
  }
  return buf;
}

interface Recipe {
  /** Band-pass centre and width for the noise bed. */
  filter: { type: BiquadFilterType; freq: number; q: number };
  /** Optional tonal partials (Hz, relative gain). */
  tones?: Array<[number, number]>;
  /** Amplitude modulation: rate in Hz and depth 0..1. */
  am?: { rate: number; depth: number };
  bedGain: number;
}

const RECIPES: Record<SoundId, Recipe> = {
  breathing: { filter: { type: "bandpass", freq: 500, q: 0.7 }, am: { rate: 0.28, depth: 0.95 }, bedGain: 0.9 },
  leaves: { filter: { type: "highpass", freq: 2600, q: 0.7 }, am: { rate: 1.7, depth: 0.6 }, bedGain: 0.8 },
  whisper: { filter: { type: "bandpass", freq: 1800, q: 0.9 }, am: { rate: 3.4, depth: 0.7 }, bedGain: 0.85 },
  fridge: { filter: { type: "lowpass", freq: 320, q: 0.8 }, tones: [[100, 0.5], [200, 0.15]], am: { rate: 0.15, depth: 0.15 }, bedGain: 0.5 },
  rain: { filter: { type: "highpass", freq: 1200, q: 0.5 }, am: { rate: 0.8, depth: 0.2 }, bedGain: 1 },
  conversation: { filter: { type: "bandpass", freq: 900, q: 1.1 }, tones: [[180, 0.25], [270, 0.12]], am: { rate: 4.6, depth: 0.85 }, bedGain: 0.7 },
  vacuum: { filter: { type: "bandpass", freq: 700, q: 0.6 }, tones: [[130, 0.5], [390, 0.2]], am: { rate: 0.4, depth: 0.1 }, bedGain: 1 },
  traffic: { filter: { type: "lowpass", freq: 900, q: 0.7 }, tones: [[70, 0.5], [140, 0.2]], am: { rate: 0.35, depth: 0.35 }, bedGain: 1 },
  motorcycle: { filter: { type: "bandpass", freq: 380, q: 1.4 }, tones: [[85, 0.9], [170, 0.5], [255, 0.25]], am: { rate: 11, depth: 0.7 }, bedGain: 0.75 },
  chainsaw: { filter: { type: "bandpass", freq: 1400, q: 1.2 }, tones: [[120, 0.8], [240, 0.5], [480, 0.3]], am: { rate: 26, depth: 0.9 }, bedGain: 0.9 },
};

/** Map a presentation level (dB HL-ish, 0..90) onto a safe linear gain. */
const MAX_GAIN = 0.28;
export function presentationGain(levelDb: number): number {
  const clamped = Math.max(0, Math.min(90, levelDb));
  return Math.max(0.0008, MAX_GAIN * Math.pow(10, (clamped - 90) / 22));
}

/* ------------------------------------------------------------------ */
/* Real recordings (public-domain / CC0, bundled in /public/sounds)     */
/* ------------------------------------------------------------------ */

const SAMPLE_URLS: Partial<Record<SoundId, string>> = {
  conversation: "/sounds/conversation.ogg",
  motorcycle: "/sounds/motorcycle.ogg",
  traffic: "/sounds/traffic.ogg",
  chainsaw: "/sounds/chainsaw.ogg",
  rain: "/sounds/rain.ogg",
};

const sampleCache = new Map<string, Promise<AudioBuffer | null>>();

/** Fetch + decode a bundled recording once, cached for the session. */
export async function loadSample(url: string): Promise<AudioBuffer | null> {
  const hit = sampleCache.get(url);
  if (hit) return hit;
  const p = (async () => {
    try {
      const ctx = await getAudioContext();
      const res = await fetch(url);
      if (!res.ok) return null;
      return await ctx.decodeAudioData(await res.arrayBuffer());
    } catch {
      return null;
    }
  })();
  sampleCache.set(url, p);
  return p;
}

let activeStop: (() => void) | null = null;

export function stopSoundscape() {
  activeStop?.();
  activeStop = null;
}

/** Play a chunk of a real recording at a presentation level. */
async function playSample(
  url: string,
  levelDb: number,
  durationMs: number,
): Promise<boolean> {
  const buffer = await loadSample(url);
  if (!buffer) return false;
  const ctx = await getAudioContext();
  const dur = durationMs / 1000;
  const now = ctx.currentTime + 0.03;
  const peak = presentationGain(levelDb);

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.loopStart = 0;
  src.loopEnd = buffer.duration;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + 0.12);
  g.gain.setValueAtTime(peak, now + Math.max(0.2, dur - 0.2));
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(g).connect(ctx.destination);
  const offset = Math.random() * Math.max(0, buffer.duration - dur - 0.2);
  src.start(now, offset);
  src.stop(now + dur + 0.05);

  activeStop = () => {
    try {
      src.stop();
    } catch {
      /* already stopped */
    }
  };
  await new Promise((r) => setTimeout(r, durationMs + 80));
  activeStop = null;
  return true;
}

/** Play a soundscape at a presentation level. Resolves when it finishes. */
export async function playSoundscape(
  id: SoundId,
  levelDb: number,
  durationMs = 2200,
): Promise<void> {
  stopSoundscape();
  const sampleUrl = SAMPLE_URLS[id];
  if (sampleUrl && (await playSample(sampleUrl, levelDb, durationMs))) return;
  const ctx = await getAudioContext();
  const recipe = RECIPES[id];
  const dur = durationMs / 1000;
  const now = ctx.currentTime + 0.02;

  const out = ctx.createGain();
  const peak = presentationGain(levelDb);
  out.gain.setValueAtTime(0.0001, now);
  out.gain.exponentialRampToValueAtTime(peak, now + 0.12);
  out.gain.setValueAtTime(peak, now + dur - 0.2);
  out.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  out.connect(ctx.destination);


  const nodes: Array<AudioScheduledSourceNode> = [];

  // Noise bed
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, Math.max(1, dur));
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = recipe.filter.type;
  filter.frequency.value = recipe.filter.freq;
  filter.Q.value = recipe.filter.q;
  const bed = ctx.createGain();
  bed.gain.value = recipe.bedGain;
  src.connect(filter).connect(bed);
  nodes.push(src);

  // Amplitude modulation gives each sound its rhythm (breaths, engine pulses).
  let modTarget: AudioNode = bed;
  if (recipe.am) {
    const amGain = ctx.createGain();
    amGain.gain.value = 1 - recipe.am.depth;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = recipe.am.rate;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = recipe.am.depth;
    lfo.connect(lfoDepth).connect(amGain.gain);
    bed.connect(amGain);
    modTarget = amGain;
    nodes.push(lfo);
  }
  modTarget.connect(out);

  for (const [freq, g] of recipe.tones ?? []) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    const og = ctx.createGain();
    og.gain.value = g * 0.25;
    osc.connect(og).connect(out);
    nodes.push(osc);
  }

  for (const n of nodes) {
    n.start(now);
    n.stop(now + dur + 0.05);
  }

  activeStop = () => {
    try {
      for (const n of nodes) n.stop();
    } catch {
      /* already stopped */
    }
  };

  await new Promise((r) => setTimeout(r, durationMs + 80));
  activeStop = null;
}

/* ------------------------------------------------------------------ */
/* Adaptive trainer                                                    */
/* ------------------------------------------------------------------ */

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;

export interface TrainerState {
  /** Continuous difficulty, 1 (easy) to 10 (expert). */
  level: number;
  rounds: number;
  correct: number;
  streak: number;
  history: Array<{ round: number; level: number; correct: boolean; levelDb: number }>;
}

export function createTrainer(startLevel = 3): TrainerState {
  return { level: startLevel, rounds: 0, correct: 0, streak: 0, history: [] };
}

export interface TrainingRound {
  target: Soundscape;
  options: Soundscape[];
  levelDb: number;
  choices: number;
}

/** Presentation level in dB for a difficulty: level 1 is loud, level 10 is faint. */
export function levelToDb(level: number, baselineCeilingDb = 85): number {
  const headroom = Math.max(0, baselineCeilingDb - 85); // personalised offset
  const db = 72 - (level - 1) * 6.5 + headroom;
  return Math.max(8, Math.min(80, Math.round(db)));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/**
 * Build a round. Harder levels use quieter presentation, more answer options,
 * and distractors whose real-world loudness is close to the target's.
 */
export function nextRound(state: TrainerState, ceilingDb = 85): TrainingRound {
  const target = pick(SOUNDSCAPES);
  const choices = state.level >= 8 ? 5 : state.level >= 5 ? 4 : 3;
  const spread = state.level >= 6 ? 25 : 60; // dB window distractors are drawn from

  const near = SOUNDSCAPES.filter(
    (s) => s.id !== target.id && Math.abs(s.realDb - target.realDb) <= spread,
  );
  const pool = near.length >= choices - 1 ? near : SOUNDSCAPES.filter((s) => s.id !== target.id);

  const distractors: Soundscape[] = [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (const s of shuffled) {
    if (distractors.length >= choices - 1) break;
    distractors.push(s);
  }

  const options = [target, ...distractors].sort(() => Math.random() - 0.5);
  return { target, options, levelDb: levelToDb(state.level, ceilingDb), choices };
}

/**
 * Closed loop: correct answers raise difficulty (faster on a streak), misses
 * drop it, so the trainer settles just at the edge of the listener's ability.
 */
export function scoreRound(
  state: TrainerState,
  round: TrainingRound,
  correct: boolean,
): TrainerState {
  const streak = correct ? state.streak + 1 : 0;
  const step = correct ? (streak >= 3 ? 0.9 : 0.5) : -0.8;
  const level = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, state.level + step));
  return {
    level,
    rounds: state.rounds + 1,
    correct: state.correct + (correct ? 1 : 0),
    streak,
    history: [
      ...state.history,
      { round: state.rounds + 1, level: state.level, correct, levelDb: round.levelDb },
    ],
  };
}

export function quietestHeard(state: TrainerState): number | null {
  const hits = state.history.filter((h) => h.correct);
  if (hits.length === 0) return null;
  return Math.min(...hits.map((h) => h.levelDb));
}
