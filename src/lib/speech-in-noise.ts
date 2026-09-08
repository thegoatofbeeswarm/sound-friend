/**
 * Digits-in-noise (speech-in-noise) screening.
 *
 * Three spoken digits are presented against a continuous multi-talker babble
 * bed. The speech level stays fixed and the babble level moves, so what the
 * staircase tracks is the signal-to-noise ratio (SNR) at which the listener
 * still gets all three digits right. SNR-based tests are far less dependent on
 * absolute headphone output than pure-tone thresholds, so the number is
 * comparable between runs even on uncalibrated hardware.
 *
 * The staircase is a simple 1-up / 1-down rule (all three digits correct =>
 * harder), with a coarse step that halves after the first reversals. The
 * reported SRT is the mean SNR across the settled reversals.
 */

import { unlockAudio } from "@/lib/audiometry";
import { startSampleLoop } from "@/lib/soundscapes";
import { warmUpSpeech } from "@/lib/training-modes";

export type NoiseId = "babble" | "conversation" | "traffic";

export const NOISE_TRACKS: Record<NoiseId, string> = {
  babble: "/sounds/babble.ogg",
  conversation: "/sounds/conversation.ogg",
  traffic: "/sounds/traffic.ogg",
};

export const MAX_TRIALS = 20;
export const MIN_TRIALS = 12;
/** Enough reversals for a stable estimate. */
const TARGET_REVERSALS = 8;
const START_SNR = 10;
const MIN_SNR = -14;
const MAX_SNR = 20;

export interface SinTrial {
  index: number;
  digits: number[];
  snrDb: number;
}

export interface SinState {
  snrDb: number;
  step: number;
  trials: Array<{ snrDb: number; digits: number[]; answer: number[]; correct: boolean }>;
  reversals: number[];
  lastCorrect: boolean | null;
}

export function createSinState(): SinState {
  return { snrDb: START_SNR, step: 4, trials: [], reversals: [], lastCorrect: null };
}

/**
 * Three distinct digits. The previous version only blocked a digit repeating
 * immediately, so a triplet like 4-7-4 could appear; a repeated digit is easier
 * to recover from a partial hearing, which makes trials unequal in difficulty.
 */
function randomDigits(): number[] {
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const out: number[] = [];
  while (out.length < 3 && pool.length) {
    out.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
  }
  return out;
}

export function nextSinTrial(state: SinState): SinTrial | null {
  if (isSinComplete(state)) return null;
  return { index: state.trials.length + 1, digits: randomDigits(), snrDb: state.snrDb };
}

export function isSinComplete(state: SinState): boolean {
  if (state.trials.length >= MAX_TRIALS) return true;
  return state.trials.length >= MIN_TRIALS && state.reversals.length >= TARGET_REVERSALS;
}

export function applySinResponse(
  state: SinState,
  trial: SinTrial,
  answer: number[],
): SinState {
  const correct =
    answer.length === trial.digits.length && answer.every((d, i) => d === trial.digits[i]);

  const reversal = state.lastCorrect !== null && state.lastCorrect !== correct;
  const reversals = reversal ? [...state.reversals, trial.snrDb] : state.reversals;
  // Coarse steps first, then fine once the staircase has bracketed the threshold.
  const step = reversals.length >= 2 ? 2 : 4;
  const nextSnr = Math.max(
    MIN_SNR,
    Math.min(MAX_SNR, trial.snrDb + (correct ? -step : step)),
  );

  return {
    snrDb: nextSnr,
    step,
    trials: [...state.trials, { snrDb: trial.snrDb, digits: trial.digits, answer, correct }],
    reversals,
    lastCorrect: correct,
  };
}

export interface SinResult {
  /** Speech reception threshold in dB SNR (lower is better). */
  srtDb: number;
  /** 0-100 listening score derived from the SRT. */
  score: number;
  trials: number;
  reversals: number;
  /** Rough spread of the reversal points, in dB. */
  spreadDb: number;
}

export function sinResult(state: SinState): SinResult | null {
  if (state.trials.length === 0) return null;
  // Drop the first two reversals: those are still the coarse search.
  const settled = state.reversals.length >= 4 ? state.reversals.slice(2) : state.reversals;
  const sample = settled.length
    ? settled
    : state.trials.slice(-6).map((t) => t.snrDb);
  const srt = sample.reduce((a, b) => a + b, 0) / sample.length;
  const spread =
    sample.length > 1 ? Math.max(...sample) - Math.min(...sample) : 0;

  return {
    srtDb: Math.round(srt * 10) / 10,
    score: Math.max(0, Math.min(100, Math.round(100 - (srt + 8) * 5))),
    trials: state.trials.length,
    reversals: state.reversals.length,
    spreadDb: Math.round(spread * 10) / 10,
  };
}

export type SinBand = "strong" | "typical" | "watch" | "difficult";

/**
 * Where the current SNR sits on the deliverable range, 0 (easiest) to 100.
 * The staircase drives this up every time a triplet is answered correctly, so
 * it is the honest readout of "how hard is this getting".
 */
export function sinDifficulty(state: SinState): number {
  const pct = ((MAX_SNR - state.snrDb) / (MAX_SNR - MIN_SNR)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function sinBand(srtDb: number): SinBand {
  if (srtDb <= -6) return "strong";
  if (srtDb <= 0) return "typical";
  if (srtDb <= 6) return "watch";
  return "difficult";
}

/* ------------------------------------------------------------------ */
/* Playback                                                            */
/* ------------------------------------------------------------------ */

/** Speech gain is fixed; the babble moves around it. */
const SPEECH_LEVEL = 1;

/**
 * Gain that sits at roughly 0 dB SNR against the reference-normalized masker.
 *
 * This used to be 0.16 with the delivered gain clamped to 0.5, which meant the
 * clamp bound at about -10 dB SNR: every trial from -10 down to the staircase's
 * -14 floor played identical noise while being recorded as a different SNR, so
 * the staircase could not converge below -10 and the reported SRT was biased.
 * The reference is now low enough that the whole MIN_SNR..MAX_SNR range fits
 * under the safety ceiling with headroom to spare.
 */
const NOISE_REF_GAIN = 0.1;
/** Hard safety limit. With the reference above, MIN_SNR lands well beneath it. */
const NOISE_MAX_GAIN = 0.56;

/**
 * Maskers are high-passed before they are levelled.
 *
 * The bundled recordings are heavily weighted to rumble below 125 Hz - the
 * traffic clip has about 95% of its energy down there. Rumble masks almost
 * nothing in the 300-3400 Hz speech band but it dominates the loudness measure,
 * so without this the nominal SNR bore little relation to how hard the digits
 * actually were, and the three noise conditions were not comparable to each
 * other.
 */
const MASKER_HIGHPASS_HZ = 110;

let stopNoise: (() => void) | null = null;

export function stopSinAudio() {
  stopNoise?.();
  stopNoise = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/** True when the requested SNR can actually be delivered rather than clipped. */
export function snrIsDeliverable(snrDb: number): boolean {
  return NOISE_REF_GAIN * Math.pow(10, -snrDb / 20) <= NOISE_MAX_GAIN;
}

async function startNoise(noise: NoiseId, snrDb: number): Promise<void> {
  const target = NOISE_REF_GAIN * Math.pow(10, -snrDb / 20);
  const gain = Math.min(NOISE_MAX_GAIN, target);
  // startSampleLoop pins the loop to the measured content region, so the bed no
  // longer falls silent for the two seconds of padding at the end of each clip.
  stopNoise = await startSampleLoop(NOISE_TRACKS[noise], {
    gain,
    highPassHz: MASKER_HIGHPASS_HZ,
    fadeMs: 350,
  });
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function speakDigits(digits: number[]): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    await wait(1800);
    return;
  }
  const synth = window.speechSynthesis;
  await warmUpSpeech();
  synth.cancel();
  await wait(120);

  const voices = synth.getVoices();
  const voice =
    voices.find((v) => v.default && v.lang?.toLowerCase().startsWith("en")) ??
    voices.find((v) => v.lang?.toLowerCase().startsWith("en"));

  await new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(digits.join(", "));
    u.rate = 0.85;
    u.volume = SPEECH_LEVEL;
    if (voice) u.voice = voice;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearInterval(keepAlive);
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    const keepAlive = setInterval(() => {
      if (synth.speaking && !synth.paused) synth.resume();
    }, 4000);
    synth.speak(u);
    setTimeout(finish, 9000);
  });
}

/** Play one trial: babble in, digits spoken over it, babble out. */
export async function playSinTrial(trial: SinTrial, noise: NoiseId): Promise<void> {
  stopSinAudio();
  await unlockAudio();
  await startNoise(noise, trial.snrDb);
  await wait(700);
  await speakDigits(trial.digits);
  await wait(400);
  stopSinAudio();
}
