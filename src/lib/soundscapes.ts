/**
 * Real-world soundscape library + adaptive hearing-training engine.
 *
 * Every sound is synthesized in the browser with the Web Audio API and carries
 * the loudness it would have in real life (dB SPL at a typical distance). The
 * trainer presents them attenuated: the harder the level, the quieter and the
 * more crowded the answer set becomes.
 */

import { dbToGain, getAudioContext, SILENT_GAIN } from "@/lib/audiometry";

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

function noiseBuffer(ctx: BaseAudioContext, seconds: number): AudioBuffer {
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

/**
 * Map a presentation level (dB HL-ish, 0..90) onto a safe linear gain.
 *
 * Two things used to be wrong here. The exponent divided by 22 rather than 20,
 * so the curve was not actually decibels, and a floor of 8e-4 meant every level
 * below ~34 dB played at one identical loudness. Since the trainer's hardest
 * levels sit at 8-19 dB, difficulty stopped increasing exactly where it was
 * supposed to bite hardest. Both are corrected by delegating to the shared
 * conversion.
 */
const MAX_GAIN = 0.28;
export function presentationGain(levelDb: number): number {
  return dbToGain(Math.max(0, Math.min(90, levelDb)), MAX_GAIN, 90);
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

/**
 * A decoded recording plus everything needed to present it accurately.
 *
 * Both matter for measurement validity:
 *
 * - `startSec`/`endSec` bound the part of the file that actually contains
 *   audio. Every bundled 6 s clip carries roughly 2 s of digital silence at the
 *   end. Playback used to pick a random start anywhere in the file and loops ran
 *   over the whole buffer, so a listener could be handed a window that was
 *   mostly silence, and a looping noise bed dropped out completely for two
 *   seconds in every six. In the speech-in-noise test that gap can land right on
 *   the digits, which hands the listener an effectively infinite SNR on a trial
 *   the staircase records as difficult.
 *
 * - `rms` is the measured loudness of that content. The recordings differ by
 *   about 10 dB between the quietest and loudest, so applying one presentation
 *   gain to all of them made "40 dB" mean a different loudness per sound.
 */
export interface SampleInfo {
  buffer: AudioBuffer;
  /** First second of real content. */
  startSec: number;
  /** Last second of real content. */
  endSec: number;
  /** RMS of the content region, linear. */
  rms: number;
  /** Gain that brings this recording to the shared reference loudness. */
  normalize: number;
}

/**
 * Every recording is presented as if its content sat at this RMS.
 *
 * Chosen so the delivered masker level at 0 dB SNR matches what the speech test
 * produced before normalization existed, which keeps previously recorded SRTs
 * roughly comparable, while leaving enough headroom that the staircase's
 * loudest masker still peaks below full scale.
 */
const REFERENCE_RMS = 0.22;

/**
 * RBJ biquad high-pass, matching what BiquadFilterNode("highpass") does.
 * Used to measure a recording as it will actually be heard: the maskers are
 * high-passed on the way out, and for the traffic clip that removes most of the
 * file's energy, so measuring the unfiltered signal would leave the bed several
 * dB quieter than intended.
 */
function highPassRms(
  data: Float32Array,
  sampleRate: number,
  from: number,
  to: number,
  freq: number,
  q = 0.7,
): number {
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  const b0 = (1 + cos) / 2;
  const b1 = -(1 + cos);
  const b2 = (1 + cos) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;

  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  let sum = 0;
  let count = 0;
  for (let i = from; i < to; i++) {
    const x0 = data[i]!;
    const y0 = (b0 / a0) * x0 + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
    // Skip the first 50 ms so the filter's settling transient is not measured.
    if (i - from > sampleRate * 0.05) {
      sum += y0 * y0;
      count++;
    }
  }
  return Math.sqrt(sum / Math.max(1, count));
}

/** Normalization for a sample as it will be heard, with the filter applied. */
const filteredNorm = new Map<string, number>();

function normalizeFor(url: string, info: SampleInfo, highPassHz?: number): number {
  if (!highPassHz) return info.normalize;
  const key = `${url}@${highPassHz}`;
  const hit = filteredNorm.get(key);
  if (hit != null) return hit;
  const data = info.buffer.getChannelData(0);
  const sr = info.buffer.sampleRate;
  const rms = highPassRms(
    data,
    sr,
    Math.floor(info.startSec * sr),
    Math.floor(info.endSec * sr),
    highPassHz,
  );
  const value = Math.min(8, Math.max(0.15, rms > 1e-6 ? REFERENCE_RMS / rms : info.normalize));
  filteredNorm.set(key, value);
  return value;
}

/** Measure where the audio actually is, and how loud it is once there. */
function analyzeBuffer(buffer: AudioBuffer): SampleInfo {
  const data = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  const hop = Math.max(1, Math.floor(sr * 0.02));
  const frames = Math.floor(data.length / hop);

  const levels: number[] = [];
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    const base = f * hop;
    for (let i = 0; i < hop; i++) sum += data[base + i]! ** 2;
    levels.push(Math.sqrt(sum / hop));
  }

  const sorted = [...levels].sort((a, b) => a - b);
  const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? 0;
  // 30 dB below the loud part of the clip counts as silence.
  const threshold = Math.max(1e-5, p90 * Math.pow(10, -30 / 20));

  let first = -1;
  let last = -1;
  for (let f = 0; f < frames; f++) {
    if (levels[f]! > threshold) {
      if (first < 0) first = f;
      last = f;
    }
  }

  // A clip with no detectable content is used whole rather than not at all.
  if (first < 0 || last <= first) {
    const rms = Math.sqrt(data.reduce((a, v) => a + v * v, 0) / Math.max(1, data.length));
    return {
      buffer,
      startSec: 0,
      endSec: buffer.duration,
      rms,
      normalize: rms > 1e-6 ? REFERENCE_RMS / rms : 1,
    };
  }

  const startSec = (first * hop) / sr;
  const endSec = Math.min(buffer.duration, ((last + 1) * hop) / sr);

  let sum = 0;
  let count = 0;
  for (let i = first * hop; i < Math.min(data.length, (last + 1) * hop); i++) {
    sum += data[i]! ** 2;
    count++;
  }
  const rms = Math.sqrt(sum / Math.max(1, count));

  return {
    buffer,
    startSec,
    endSec,
    rms,
    // Clamped so a very quiet file cannot be boosted into clipping.
    normalize: Math.min(6, Math.max(0.15, rms > 1e-6 ? REFERENCE_RMS / rms : 1)),
  };
}

const sampleCache = new Map<string, Promise<SampleInfo | null>>();

/** Fetch, decode and measure a bundled recording once, cached for the session. */
export async function loadSampleInfo(url: string): Promise<SampleInfo | null> {
  const hit = sampleCache.get(url);
  if (hit) return hit;
  const p = (async () => {
    try {
      const ctx = await getAudioContext();
      const res = await fetch(url);
      if (!res.ok) return null;
      return analyzeBuffer(await ctx.decodeAudioData(await res.arrayBuffer()));
    } catch {
      return null;
    }
  })();
  sampleCache.set(url, p);
  return p;
}

export async function loadSample(url: string): Promise<AudioBuffer | null> {
  return (await loadSampleInfo(url))?.buffer ?? null;
}

/**
 * Loop a recording as a continuous bed at a known loudness.
 *
 * The loop points are pinned to the measured content region so the bed never
 * drops into the file's trailing silence, and the gain is normalized so the
 * same `gain` argument produces the same loudness whichever recording is used.
 * `highPassHz` removes rumble that masks nothing useful but eats headroom.
 */
export async function startSampleLoop(
  url: string,
  opts: { gain: number; highPassHz?: number; fadeMs?: number },
): Promise<(() => void) | null> {
  const info = await loadSampleInfo(url);
  if (!info) return null;
  const ctx = await getAudioContext();
  const now = ctx.currentTime + 0.03;
  const fade = (opts.fadeMs ?? 250) / 1000;

  const src = ctx.createBufferSource();
  src.buffer = info.buffer;
  src.loop = true;
  src.loopStart = info.startSec;
  src.loopEnd = info.endSec;

  const g = ctx.createGain();
  const peak = Math.max(SILENT_GAIN, opts.gain * normalizeFor(url, info, opts.highPassHz));
  g.gain.setValueAtTime(SILENT_GAIN, now);
  g.gain.exponentialRampToValueAtTime(peak, now + fade);

  let node: AudioNode = src;
  if (opts.highPassHz) {
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = opts.highPassHz;
    hp.Q.value = 0.7;
    src.connect(hp);
    node = hp;
  }
  node.connect(g).connect(ctx.destination);

  // Start somewhere inside the content so the bed is never silent on entry.
  const span = Math.max(0, info.endSec - info.startSec - 0.5);
  src.start(now, info.startSec + Math.random() * span);

  return () => {
    try {
      const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(SILENT_GAIN, g.gain.value), t);
      g.gain.exponentialRampToValueAtTime(SILENT_GAIN, t + 0.25);
      src.stop(t + 0.35);
    } catch {
      /* already stopped */
    }
  };
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
  const info = await loadSampleInfo(url);
  if (!info) return false;
  const ctx = await getAudioContext();
  const dur = durationMs / 1000;
  const now = ctx.currentTime + 0.03;
  // Normalized so every sound really is presented at `levelDb`.
  const peak = Math.max(SILENT_GAIN, presentationGain(levelDb) * info.normalize);

  const src = ctx.createBufferSource();
  src.buffer = info.buffer;
  // Loop across the content region only, so a window that runs past the end of
  // the audio wraps back into sound rather than into the trailing silence.
  src.loop = true;
  src.loopStart = info.startSec;
  src.loopEnd = info.endSec;
  const g = ctx.createGain();
  g.gain.setValueAtTime(SILENT_GAIN, now);
  g.gain.exponentialRampToValueAtTime(peak, now + 0.12);
  g.gain.setValueAtTime(peak, now + Math.max(0.2, dur - 0.2));
  g.gain.exponentialRampToValueAtTime(SILENT_GAIN, now + dur);
  src.connect(g).connect(ctx.destination);
  // Start inside the content region, never in the padding.
  const span = Math.max(0, info.endSec - info.startSec - 0.3);
  const offset = info.startSec + Math.random() * span;
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

/**
 * Wire up a recipe's noise bed, modulation and partials into `out`, starting at
 * `startAt`. Shared by live playback and the offline loudness measurement below
 * so what gets measured is exactly what gets played.
 */
function buildRecipeGraph(
  ctx: BaseAudioContext,
  id: SoundId,
  out: AudioNode,
  startAt: number,
  dur: number,
): AudioScheduledSourceNode[] {
  const recipe = RECIPES[id];
  const nodes: AudioScheduledSourceNode[] = [];

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
    n.start(startAt);
    n.stop(startAt + dur + 0.05);
  }
  return nodes;
}

/**
 * Loudness-match the synthesized sounds to the recordings.
 *
 * Each recipe has its own bed gain, filter and partials, so at one presentation
 * level a synthesized whisper and a recorded motorbike came out several dB
 * apart. Rendering the recipe once offline and measuring it gives the same
 * normalization the recordings get, which is what makes a level of "40 dB" mean
 * one loudness across the whole library.
 */
const recipeNorm = new Map<SoundId, Promise<number>>();

function measureRecipe(id: SoundId): Promise<number> {
  const hit = recipeNorm.get(id);
  if (hit) return hit;
  const p = (async () => {
    try {
      const Offline =
        typeof OfflineAudioContext !== "undefined"
          ? OfflineAudioContext
          : (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
              .webkitOfflineAudioContext;
      if (!Offline) return 1;
      const sr = 44100;
      const seconds = 1.5;
      const off = new Offline(1, Math.floor(sr * seconds), sr);
      const out = off.createGain();
      out.gain.value = 1;
      out.connect(off.destination);
      buildRecipeGraph(off, id, out, 0, seconds - 0.1);
      const rendered = await off.startRendering();
      const d = rendered.getChannelData(0);
      // Skip the first 100 ms so filter settling does not skew the measurement.
      const from = Math.floor(sr * 0.1);
      let sum = 0;
      for (let i = from; i < d.length; i++) sum += d[i]! ** 2;
      const rms = Math.sqrt(sum / Math.max(1, d.length - from));
      if (!(rms > 1e-6)) return 1;
      return Math.min(6, Math.max(0.15, REFERENCE_RMS / rms));
    } catch {
      return 1;
    }
  })();
  recipeNorm.set(id, p);
  return p;
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
  const norm = await measureRecipe(id);
  const dur = durationMs / 1000;
  const now = ctx.currentTime + 0.02;

  const out = ctx.createGain();
  const peak = Math.max(SILENT_GAIN, presentationGain(levelDb) * norm);
  out.gain.setValueAtTime(SILENT_GAIN, now);
  out.gain.exponentialRampToValueAtTime(peak, now + 0.12);
  out.gain.setValueAtTime(peak, now + Math.max(0.2, dur - 0.2));
  out.gain.exponentialRampToValueAtTime(SILENT_GAIN, now + dur);
  out.connect(ctx.destination);

  const nodes = buildRecipeGraph(ctx, id, out, now, dur);

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
  /**
   * Difficulty can never fall below this. It creeps up with every answered
   * round, so a session always ends harder than it started: without it the
   * staircase can sit on one level for twelve rounds, or slide back to the
   * opening difficulty after a couple of misses.
   */
  floor: number;
  history: Array<{ round: number; level: number; correct: boolean; levelDb: number }>;
}

export function createTrainer(startLevel = 3): TrainerState {
  return { level: startLevel, rounds: 0, correct: 0, streak: 0, floor: startLevel, history: [] };
}

/** How much the guaranteed minimum difficulty rises per answered round. */
export const FLOOR_STEP = 0.22;

/** Difficulty floor after `rounds` answered questions from `startLevel`. */
export function floorAfter(startLevel: number, rounds: number): number {
  return Math.min(MAX_LEVEL, startLevel + rounds * FLOOR_STEP);
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
/**
 * Closed loop: correct answers raise difficulty (faster on a streak), misses
 * drop it, so the trainer settles just at the edge of the listener's ability.
 * A rising floor is applied afterwards so a run of misses can soften the next
 * question without ever taking the session back to where it began.
 */
export function scoreRound(
  state: TrainerState,
  round: TrainingRound,
  correct: boolean,
): TrainerState {
  const streak = correct ? state.streak + 1 : 0;
  const step = correct ? (streak >= 3 ? 0.9 : 0.5) : -0.8;
  const rounds = state.rounds + 1;
  const floor = Math.min(MAX_LEVEL, state.floor + FLOOR_STEP);
  const level = Math.max(MIN_LEVEL, floor, Math.min(MAX_LEVEL, state.level + step));
  return {
    level,
    rounds,
    correct: state.correct + (correct ? 1 : 0),
    streak,
    floor,
    history: [
      ...state.history,
      { round: rounds, level: state.level, correct, levelDb: round.levelDb },
    ],
  };
}

export function quietestHeard(state: TrainerState): number | null {
  const hits = state.history.filter((h) => h.correct);
  if (hits.length === 0) return null;
  return Math.min(...hits.map((h) => h.levelDb));
}
