/**
 * Local listening-exposure log. Entries are kept in the browser so the app can
 * describe listening *behaviour* over time without claiming any medical
 * threshold. Everything here is an estimate derived from what the user reports.
 */

export interface ExposureEntry {
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
  /** Minutes of listening logged for that day. */
  minutes: number;
  /** Estimated average level across the logged time, dB SPL. */
  avgDb: number;
  /** Estimated loudest sustained level that day, dB SPL. */
  peakDb: number;
}

const KEY = "audiomaxxer.exposure.v1";
const MAX_DAYS = 60;

export function dayId(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function loadExposure(): ExposureEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ExposureEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e.day === "string")
      .sort((a, b) => (a.day < b.day ? 1 : -1))
      .slice(0, MAX_DAYS);
  } catch {
    return [];
  }
}

function save(entries: ExposureEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_DAYS)));
  } catch {
    /* storage unavailable — logging is best-effort */
  }
}

/** Add listening to today's entry, merging with anything already logged. */
export function logListening(minutes: number, levelDb: number): ExposureEntry[] {
  const entries = loadExposure();
  const today = dayId();
  const idx = entries.findIndex((e) => e.day === today);
  if (idx === -1) {
    const next = [{ day: today, minutes, avgDb: levelDb, peakDb: levelDb }, ...entries];
    save(next);
    return next;
  }
  const cur = entries[idx] as ExposureEntry;
  const total = cur.minutes + minutes;
  const merged: ExposureEntry = {
    day: today,
    minutes: total,
    avgDb: total > 0 ? Math.round((cur.avgDb * cur.minutes + levelDb * minutes) / total) : levelDb,
    peakDb: Math.max(cur.peakDb, levelDb),
  };
  const next = [...entries];
  next[idx] = merged;
  save(next);
  return next;
}

export function clearToday(): ExposureEntry[] {
  const next = loadExposure().filter((e) => e.day !== dayId());
  save(next);
  return next;
}

export function todayEntry(entries: ExposureEntry[]): ExposureEntry | null {
  return entries.find((e) => e.day === dayId()) ?? null;
}

/** WHO-style dose: 100% = 8 h at 85 dB, allowance halving every 3 dB. */
export function dosePercent(levelDb: number, hours: number): number {
  const allowed = 8 * Math.pow(2, (85 - levelDb) / 3);
  return Math.round((hours / allowed) * 100);
}

export type ExposureStatus = "low" | "moderate" | "high";

export function statusForDose(dose: number): ExposureStatus {
  if (dose <= 60) return "low";
  if (dose <= 100) return "moderate";
  return "high";
}

export const STATUS_LABEL: Record<ExposureStatus, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

export interface ExposureWindow {
  days: number;
  totalMinutes: number;
  avgDb: number | null;
  peakDb: number | null;
  avgDosePercent: number;
}

function windowFor(entries: ExposureEntry[], from: Date, to: Date): ExposureWindow {
  const fromId = dayId(from);
  const toId = dayId(to);
  const rows = entries.filter((e) => e.day >= fromId && e.day <= toId);
  const totalMinutes = rows.reduce((a, r) => a + r.minutes, 0);
  const avgDb =
    totalMinutes > 0
      ? Math.round(rows.reduce((a, r) => a + r.avgDb * r.minutes, 0) / totalMinutes)
      : null;
  const peakDb = rows.length ? Math.max(...rows.map((r) => r.peakDb)) : null;
  const doses = rows.map((r) => dosePercent(r.avgDb, r.minutes / 60));
  const avgDosePercent = doses.length ? Math.round(doses.reduce((a, d) => a + d, 0) / doses.length) : 0;
  return { days: rows.length, totalMinutes, avgDb, peakDb, avgDosePercent };
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function lastSevenDays(entries: ExposureEntry[]): ExposureWindow {
  return windowFor(entries, daysAgo(6), new Date());
}

export function priorSevenDays(entries: ExposureEntry[]): ExposureWindow {
  return windowFor(entries, daysAgo(13), daysAgo(7));
}

/** Percentage change in total logged listening minutes, week over week. */
export function weeklyTrendPercent(entries: ExposureEntry[]): number | null {
  const now = lastSevenDays(entries);
  const prev = priorSevenDays(entries);
  if (prev.totalMinutes === 0) return null;
  return Math.round(((now.totalMinutes - prev.totalMinutes) / prev.totalMinutes) * 100);
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
