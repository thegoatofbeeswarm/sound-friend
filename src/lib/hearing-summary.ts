import type { Ear, ThresholdResult } from "@/lib/audiometry";

export type EarSummary = {
  ear: Ear;
  avgDb: number;
  highFreqDb: number;
  label: string;
  detail: string;
  tone: "ok" | "watch" | "risk";
};

/** 0-100 score: 100 means every threshold sits at or below 0 dB HL. */
export function hearingScore(points: ThresholdResult[]): number | null {
  if (points.length === 0) return null;
  const avg = points.reduce((s, p) => s + p.thresholdDb, 0) / points.length;
  // 0 dB HL -> 100, 40 dB HL -> ~40, 60 dB HL -> ~10
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

  const weak = mine.filter((p) => p.thresholdDb >= 25).map((p) => p.frequency);
  let label = "Normal";
  let tone: EarSummary["tone"] = "ok";
  let detail = "Thresholds within the normal range across all tested tones.";

  if (avgDb >= 40) {
    label = "Moderate reduction";
    tone = "risk";
    detail = "Reduced sensitivity across most of the tested range.";
  } else if (avgDb >= 25) {
    label = "Mild reduction";
    tone = "risk";
    detail = weak.length ? `Weakest around ${fmtRange(weak)}.` : "Reduced sensitivity overall.";
  } else if (highFreqDb >= 20) {
    label = "Slight reduction at 4–8 kHz";
    tone = "watch";
    detail = "High-frequency sensitivity is the first thing noise exposure tends to affect.";
  } else if (weak.length) {
    label = "Slight reduction";
    tone = "watch";
    detail = `Weakest around ${fmtRange(weak)}.`;
  }

  return { ear, avgDb, highFreqDb, label, detail, tone };
}

/** Positive = thresholds went up (worse) since the previous screening. */
export function changeSinceLast(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null) return null;
  return Math.round((current - previous) * 10) / 10;
}

export function listeningRisk(
  worstDb: number | null,
  ceilingDb: number,
): { label: string; tone: "ok" | "watch" | "risk" } {
  if (worstDb == null) return { label: "Unknown", tone: "watch" };
  if (worstDb >= 35 || ceilingDb <= 78) return { label: "High", tone: "risk" };
  if (worstDb >= 20 || ceilingDb < 85) return { label: "Moderate", tone: "watch" };
  return { label: "Low", tone: "ok" };
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
