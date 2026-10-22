/**
 * Local listening-exposure log. Entries are kept in the browser so the app can
 * describe listening *behaviour* over time without claiming any medical
 * threshold. Everything here is an estimate derived from what the user reports.
 */

/** One logged stretch of listening at a single estimated level. */
export interface ExposureSegment {
  minutes: number;
  /** Estimated level for this stretch, dB SPL (reported, not measured). */
  db: number;
}

export interface ExposureEntry {
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
  /** Minutes of listening logged for that day. */
  minutes: number;
  /**
   * Energy-equivalent average level across the logged time, dB SPL. Derived
   * from `segments` when they exist; kept as a field for older readers.
   */
  avgDb: number;
  /** Estimated loudest sustained level that day, dB SPL. */
  peakDb: number;
  /** Every stretch logged that day, so doses are summed per stretch. */
  segments?: ExposureSegment[];
  /**
   * True for days saved before segments were kept. Their `avgDb` was a
   * time-weighted mean of dB values, which understates loud stretches, and
   * cannot be rebuilt; treat their dose as a lower bound.
   */
  legacyMerged?: boolean;
}

const KEY = "audiomaxxer.exposure.v1";
const MAX_DAYS = 60;

export function dayId(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Older entries have no segments; mark them so their numbers can be labelled. */
function upgrade(e: ExposureEntry): ExposureEntry {
  if (Array.isArray(e.segments) && e.segments.length) return e;
  return { ...e, segments: [{ minutes: e.minutes, db: e.avgDb }], legacyMerged: e.minutes > 0 };
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
      .map(upgrade)
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

/**
 * Energy-equivalent level of several stretches: decibels are averaged as sound
 * energy, so an hour at 100 dB dominates an hour at 70 dB (about 97 dB, not 85).
 */
export function equivalentLevelDb(segments: ExposureSegment[]): number | null {
  const total = segments.reduce((a, s) => a + s.minutes, 0);
  if (total <= 0) return null;
  const energy = segments.reduce((a, s) => a + s.minutes * Math.pow(10, s.db / 10), 0);
  return 10 * Math.log10(energy / total);
}

/** Add listening to today's entry as its own stretch. */
export function logListening(minutes: number, levelDb: number): ExposureEntry[] {
  const entries = loadExposure();
  const today = dayId();
  const idx = entries.findIndex((e) => e.day === today);
  const cur = idx === -1 ? null : (entries[idx] as ExposureEntry);
  const segments = [...(cur?.segments ?? []), { minutes, db: levelDb }];
  const total = segments.reduce((a, s) => a + s.minutes, 0);
  const merged: ExposureEntry = {
    day: today,
    minutes: total,
    avgDb: Math.round(equivalentLevelDb(segments) ?? levelDb),
    peakDb: Math.max(cur?.peakDb ?? levelDb, levelDb),
    segments,
    ...(cur?.legacyMerged ? { legacyMerged: true } : {}),
  };
  const next = idx === -1 ? [merged, ...entries] : entries.map((e, i) => (i === idx ? merged : e));
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

/**
 * Reference model for the dose figures: the NIOSH occupational reference,
 * 85 dBA for 8 hours with a 3 dB exchange rate. It is a way to compare time
 * and level, not a personal safety limit. (The WHO-ITU standard for personal
 * listening devices uses a weekly allowance instead: 80 dB for 40 hours a
 * week for adults, 75 dB for children.)
 */
export const DOSE_REFERENCE = { name: "NIOSH", levelDb: 85, hours: 8, exchangeDb: 3 } as const;

/** Unrounded dose for one stretch, as a fraction of the reference (1 = 100%). */
function doseFraction(levelDb: number, hours: number): number {
  const allowed = DOSE_REFERENCE.hours * Math.pow(2, (DOSE_REFERENCE.levelDb - levelDb) / DOSE_REFERENCE.exchangeDb);
  return hours / allowed;
}

/** Dose for a single level and duration, in percent of the reference. */
export function dosePercent(levelDb: number, hours: number): number {
  return Math.round(doseFraction(levelDb, hours) * 100);
}

/** A day's dose: each stretch's contribution summed before rounding. */
export function entryDosePercent(entry: ExposureEntry): number {
  const segments = entry.segments?.length ? entry.segments : [{ minutes: entry.minutes, db: entry.avgDb }];
  return Math.round(segments.reduce((a, s) => a + doseFraction(s.db, s.minutes / 60), 0) * 100);
}

export type ExposureStatus = "low" | "moderate" | "high";

export function statusForDose(dose: number): ExposureStatus {
  if (dose <= 60) return "low";
  if (dose <= 100) return "moderate";
  return "high";
}

export const STATUS_LABEL: Record<ExposureStatus | "legacy", string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  legacy: "Not comparable (old-format log)",
};

/**
 * Status for a day, or "legacy" for days saved before per-stretch logging.
 * Their merged level understates loud stretches, so they get no reassuring
 * current-model classification.
 */
export function entryStatus(entry: ExposureEntry): ExposureStatus | "legacy" {
  return entry.legacyMerged ? "legacy" : statusForDose(entryDosePercent(entry));
}

/** Weekly status, or "legacy" when any day in the window is old-format. */
export function windowStatus(w: ExposureWindow): ExposureStatus | "legacy" {
  return w.includesLegacy ? "legacy" : statusForDose(w.avgDosePercent);
}

export interface ExposureWindow {
  days: number;
  totalMinutes: number;
  /** Energy-equivalent level across the window. */
  avgDb: number | null;
  peakDb: number | null;
  avgDosePercent: number;
  /** True when any day in the window predates per-stretch logging. */
  includesLegacy: boolean;
}

function windowFor(entries: ExposureEntry[], from: Date, to: Date): ExposureWindow {
  const fromId = dayId(from);
  const toId = dayId(to);
  const rows = entries.filter((e) => e.day >= fromId && e.day <= toId);
  const totalMinutes = rows.reduce((a, r) => a + r.minutes, 0);
  const segments = rows.flatMap((r) => (r.segments?.length ? r.segments : [{ minutes: r.minutes, db: r.avgDb }]));
  const leq = equivalentLevelDb(segments);
  const avgDb = leq == null ? null : Math.round(leq);
  const peakDb = rows.length ? Math.max(...rows.map((r) => r.peakDb)) : null;
  const doses = rows.map(entryDosePercent);
  const avgDosePercent = doses.length ? Math.round(doses.reduce((a, d) => a + d, 0) / doses.length) : 0;
  return { days: rows.length, totalMinutes, avgDb, peakDb, avgDosePercent, includesLegacy: rows.some((r) => r.legacyMerged) };
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
