import type { Ear, ThresholdResult } from "@/lib/audiometry";

export type EarSummary = {
  ear: Ear;
  avgDb: number;
  highFreqDb: number;
  /** Which description applies; the UI translates it. */
  pattern: "even" | "highFreq" | "around";
  /** Frequency range for the "around" pattern, e.g. "1–2 kHz". */
  range: string | null;
};

/**
 * 0-100 score from the average estimated level (lower level = higher score).
 * Levels are relative and device-dependent, so compare a score only with your
 * own earlier screenings on the same headphones and volume.
 */
export function hearingScore(points: ThresholdResult[]): number | null {
  if (points.length === 0) return null;
  const avg = points.reduce((s, p) => s + p.thresholdDb, 0) / points.length;
  // 0 dB -> 100, 40 dB -> ~40, 60 dB -> ~10
  const score = 100 - Math.max(0, avg) * 1.5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreTone(score: number): "ok" | "watch" | "risk" {
  if (score >= 80) return "ok";
  if (score >= 60) return "watch";
  return "risk";
}

function fmtRange(freqs: number[]): string {
  const lo = Math.min(...freqs);
  const hi = Math.max(...freqs);
  const f = (v: number) => (v >= 1000 ? `${v / 1000} kHz` : `${v} Hz`);
  return lo === hi ? f(lo) : `${f(lo)}–${f(hi)}`;
}

export function summarizeEar(points: ThresholdResult[], ear: Ear): EarSummary | null {
  const mine = points.filter((p) => p.ear === ear);
  if (mine.length === 0) return null;
  const avgDb = mine.reduce((s, p) => s + p.thresholdDb, 0) / mine.length;
  const high = mine.filter((p) => p.frequency >= 4000);
  const highFreqDb = high.length
    ? high.reduce((s, p) => s + p.thresholdDb, 0) / high.length
    : avgDb;

  // Describe where this ear needed the most level, relative to its own other
  // tones. No clinical category: these are device-dependent estimates.
  const top = Math.max(...mine.map((p) => p.thresholdDb));
  const spread = top - Math.min(...mine.map((p) => p.thresholdDb));
  const highest = mine.filter((p) => p.thresholdDb >= top - 5).map((p) => p.frequency);
  let pattern: EarSummary["pattern"] = "even";
  if (spread >= 10 && highFreqDb - avgDb >= 5) pattern = "highFreq";
  else if (spread >= 10) pattern = "around";

  return { ear, avgDb, highFreqDb, pattern, range: pattern === "around" ? fmtRange(highest) : null };
}

/** Positive = thresholds went up (worse) since the previous screening. */
export function changeSinceLast(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null) return null;
  return Math.round((current - previous) * 10) / 10;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Consecutive days with at least one training session, ending today or yesterday. */
export function trainingStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const days = new Set(dates.map((d) => dayKey(new Date(d))));
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Days until the next recommended screening (30-day cadence). */
export function nextScreening(lastTestAt: string | null): number | null {
  if (!lastTestAt) return null;
  const due = new Date(lastTestAt);
  due.setDate(due.getDate() + 30);
  return Math.ceil((due.getTime() - Date.now()) / 86_400_000);
}
