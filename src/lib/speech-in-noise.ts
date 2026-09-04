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

import { getAudioContext, unlockAudio } from "@/lib/audiometry";
import { loadSample } from "@/lib/soundscapes";
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

function randomDigits(): number[] {
  const out: number[] = [];
  while (out.length < 3) {
    const d = Math.floor(Math.random() * 10);
    if (out[out.length - 1] !== d) out.push(d);
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
const NOISE_REF_GAIN = 0.16; // gain that sits at roughly 0 dB SNR

let stopNoise: (() => void) | null = null;

export function stopSinAudio() {
  stopNoise?.();
  stopNoise = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

async function startNoise(noise: NoiseId, snrDb: number): Promise<void> {
  const buffer = await loadSample(NOISE_TRACKS[noise]);
  if (!buffer) return;
  const ctx = await getAudioContext();
  const gain = Math.min(0.5, NOISE_REF_GAIN * Math.pow(10, -snrDb / 20));
  const now = ctx.currentTime + 0.05;

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0005, gain), now + 0.35);
  src.connect(g).connect(ctx.destination);
  src.start(now, Math.random() * Math.max(0, buffer.duration - 4));

  stopNoise = () => {
    try {
      const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(0.0005, g.gain.value), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      src.stop(t + 0.4);
    } catch {
      /* already stopped */
    }
  };
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
