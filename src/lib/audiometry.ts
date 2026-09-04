/**
 * Adaptive audiometry engine.
 *
 * Uses a Bayesian (grid) estimator over the threshold parameter of a
 * psychometric function per frequency/ear track. After every response the
 * posterior is updated, and the next trial is chosen for the track with the
 * highest remaining uncertainty, presented at that track's current posterior
 * mean. This converges far faster than a fixed 5 dB up / 10 dB down staircase.
 */

export type Ear = "left" | "right";

export const FREQUENCIES = [500, 1000, 2000, 4000, 8000] as const;
export const EARS: Ear[] = ["left", "right"];

/** dB HL grid the posterior lives on. */
const MIN_DB = -10;
const MAX_DB = 90;
const STEP_DB = 2;
export const DB_GRID: number[] = Array.from(
  { length: Math.round((MAX_DB - MIN_DB) / STEP_DB) + 1 },
  (_, i) => MIN_DB + i * STEP_DB,
);

const SLOPE = 0.25; // logistic slope (per dB)
const LAPSE = 0.03; // inattention rate
const GUESS = 0.02; // false-positive rate

/** Probability of hearing a tone of `level` given threshold `t`. */
function pHear(level: number, t: number): number {
  const p = 1 / (1 + Math.exp(-SLOPE * (level - t)));
  return GUESS + (1 - GUESS - LAPSE) * p;
}

export interface Track {
  ear: Ear;
  frequency: number;
  posterior: number[];
  trials: number;
}

export interface TestState {
  tracks: Track[];
  trialCount: number;
  maxTrials: number;
}

function priorFor(frequency: number): number[] {
  // Mild high-frequency prior: damage is most common at 4 and 8 kHz.
  const center = frequency >= 4000 ? 20 : 10;
  const sd = 22;
  const raw = DB_GRID.map((d) => Math.exp(-((d - center) ** 2) / (2 * sd * sd)));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v / sum);
}

export function createTestState(maxTrials = 44): TestState {
  const tracks: Track[] = [];
  for (const ear of EARS) {
    for (const frequency of FREQUENCIES) {
      tracks.push({ ear, frequency, posterior: priorFor(frequency), trials: 0 });
    }
  }
  return { tracks, trialCount: 0, maxTrials };
}

export function mean(posterior: number[]): number {
  return posterior.reduce((acc, p, i) => acc + p * DB_GRID[i]!, 0);
}

export function sd(posterior: number[]): number {
  const m = mean(posterior);
  const v = posterior.reduce((acc, p, i) => acc + p * (DB_GRID[i]! - m) ** 2, 0);
  return Math.sqrt(v);
}

/** Confidence 0..1 derived from posterior spread. */
export function confidence(posterior: number[]): number {
  const s = sd(posterior);
  return Math.max(0, Math.min(1, 1 - (s - 3) / 20));
}

const DONE_SD = 4.5;
const MIN_TRIALS_PER_TRACK = 3;

export function trackDone(track: Track): boolean {
  return track.trials >= MIN_TRIALS_PER_TRACK && sd(track.posterior) < DONE_SD;
}

export function isComplete(state: TestState): boolean {
  return state.trialCount >= state.maxTrials || state.tracks.every(trackDone);
}

export interface Trial {
  trackIndex: number;
  ear: Ear;
  frequency: number;
  levelDb: number;
}

/** Pick the least-certain unfinished track and probe near its posterior mean. */
export function nextTrial(state: TestState): Trial | null {
  const open = state.tracks
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => !trackDone(t));
  if (open.length === 0) return null;

  let best = open[0]!;
  let bestSd = -1;
  for (const cand of open) {
    const s = sd(cand.t.posterior) + (cand.t.trials === 0 ? 100 : 0);
    if (s > bestSd) {
      bestSd = s;
      best = cand;
    }
  }
  const m = mean(best.t.posterior);
  // Jitter around the estimate so the listener cannot anticipate loudness.
  const jitter = (Math.random() - 0.5) * 8;
  const level = Math.max(MIN_DB, Math.min(MAX_DB, Math.round(m + jitter)));
  return {
    trackIndex: best.i,
    ear: best.t.ear,
    frequency: best.t.frequency,
    levelDb: level,
  };
}

/** Bayesian update after a heard / not-heard response. */
export function applyResponse(state: TestState, trial: Trial, heard: boolean): TestState {
  const tracks = state.tracks.map((t, i) => {
    if (i !== trial.trackIndex) return t;
    const updated = t.posterior.map((p, gi) => {
      const like = pHear(trial.levelDb, DB_GRID[gi]!);
      return p * (heard ? like : 1 - like);
    });
    const sum = updated.reduce((a, b) => a + b, 0) || 1;
    return {
      ...t,
      posterior: updated.map((v) => v / sum),
      trials: t.trials + 1,
    };
  });
  return { ...state, tracks, trialCount: state.trialCount + 1 };
}

export interface ThresholdResult {
  ear: Ear;
  frequency: number;
  thresholdDb: number;
  confidence: number;
}

export function results(state: TestState): ThresholdResult[] {
  return state.tracks.map((t) => ({
    ear: t.ear,
    frequency: t.frequency,
    thresholdDb: Math.round(mean(t.posterior) * 10) / 10,
    confidence: Math.round(confidence(t.posterior) * 100) / 100,
  }));
}

export function progress(state: TestState): number {
  const done = state.tracks.filter(trackDone).length;
  return Math.min(
    1,
    Math.max(done / state.tracks.length, state.trialCount / state.maxTrials),
  );
}

/* ------------------------------------------------------------------ */
/* Interpretation                                                      */
/* ------------------------------------------------------------------ */

export function categorize(db: number): { label: string; tone: "ok" | "watch" | "risk" } {
  if (db <= 20) return { label: "Normal", tone: "ok" };
  if (db <= 35) return { label: "Early loss", tone: "watch" };
  return { label: "Notable loss", tone: "risk" };
}

/**
 * Personalized listening ceiling. The generic 85 dB guideline is shifted by
 * the listener's own elevation above normal hearing, and capped for safety.
 */
export function safeListening(rs: ThresholdResult[]) {
  const worst = Math.max(...rs.map((r) => r.thresholdDb));
  const avg = rs.reduce((a, r) => a + r.thresholdDb, 0) / rs.length;
  const elevation = Math.max(0, avg - 15);
  const ceiling = Math.round(Math.max(70, 85 - elevation * 0.8));
  // WHO-style exposure budget: 85 dB -> 8h, halving per 3 dB.
  const hours = Math.min(16, 8 * Math.pow(2, (85 - ceiling) / 3));
  return {
    worst: Math.round(worst * 10) / 10,
    avg: Math.round(avg * 10) / 10,
    ceilingDb: ceiling,
    offsetDb: ceiling - 85,
    safeHours: Math.round(hours * 10) / 10,
  };
}

/* ------------------------------------------------------------------ */
/* Tone playback (browser only)                                        */
/* ------------------------------------------------------------------ */

let ctx: AudioContext | null = null;

export async function getAudioContext(): Promise<AudioContext> {
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") await ctx.resume();
  return ctx;
}

/**
 * Prime the audio engine from a user gesture (autoplay policy).
 * Browsers routinely drop the first one or two nodes scheduled right after a
 * context is created or resumed, which made the opening rounds of a training
 * session play silence. Pushing a short silent buffer through the graph and
 * waiting for the clock to advance makes the first real sound audible.
 */
export async function unlockAudio(): Promise<void> {
  const audio = await getAudioContext();
  try {
    const buf = audio.createBuffer(1, Math.max(1, Math.floor(audio.sampleRate * 0.05)), audio.sampleRate);
    const src = audio.createBufferSource();
    src.buffer = buf;
    const g = audio.createGain();
    g.gain.value = 0.0001;
    src.connect(g).connect(audio.destination);
    src.start();
  } catch {
    /* priming is best-effort */
  }
  const start = audio.currentTime;
  for (let i = 0; i < 20; i++) {
    if (audio.state === "running" && audio.currentTime > start) break;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}


/**
 * Map a dB-HL-like level to a linear gain.
 * The loudest presentable level (90 dB) maps to the safety ceiling, and each
 * 20 dB below that divides amplitude by ten, with an audible floor.
 */
const MAX_GAIN = 0.3;

/**
 * Correction (dB) for the listening device in use. Sealed in-ear tips deliver
 * more level to the eardrum than over-ear cups, so tones are trimmed to match.
 */
let deviceOffsetDb = 0;
export function setDeviceCalibration(offsetDb: number) {
  deviceOffsetDb = offsetDb;
}

function levelToGain(levelDb: number): number {
  const clamped = Math.max(MIN_DB, Math.min(MAX_DB, levelDb - deviceOffsetDb));
  const g = MAX_GAIN * Math.pow(10, (clamped - MAX_DB) / 20);
  return Math.max(0.0006, Math.min(MAX_GAIN, g));
}

export async function playTone(
  frequency: number,
  levelDb: number,
  ear: Ear,
  durationMs = 900,
): Promise<void> {
  const audio = await getAudioContext();
  const now = audio.currentTime + 0.02;
  const dur = durationMs / 1000;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const panner = audio.createStereoPanner();

  osc.type = "sine";
  osc.frequency.value = frequency;
  panner.pan.value = ear === "left" ? -1 : 1;

  const peak = levelToGain(levelDb);
  const floor = peak * 0.001;
  gain.gain.setValueAtTime(floor, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.05);
  gain.gain.setValueAtTime(peak, now + dur - 0.05);
  gain.gain.exponentialRampToValueAtTime(floor, now + dur);

  osc.connect(gain).connect(panner).connect(audio.destination);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);

  await new Promise((r) => setTimeout(r, durationMs + 60));
}
