/** XP, levels, streaks, weekly goals and personal bests for the hearing gym. */

export interface SessionRow {
  created_at: string;
  accuracy: number;
  end_level: number;
  rounds: number;
  correct: number;
  mode: string;
  xp: number;
  duration_sec: number;
}

export const WEEKLY_GOAL_SESSIONS = 5;

/** XP for one finished session: effort + accuracy + difficulty. */
export function sessionXp(correct: number, rounds: number, endLevel: number): number {
  const accuracy = rounds > 0 ? correct / rounds : 0;
  return Math.max(5, Math.round(correct * 8 + accuracy * 40 + endLevel * 6));
}

/** Cumulative XP needed to reach a given level (1-indexed). */
export function xpForLevel(level: number): number {
  // 0, 150, 400, 750, 1200, ... quadratic-ish growth.
  const n = Math.max(1, level) - 1;
  return Math.round(50 * n * n + 100 * n);
}

export function levelFromXp(xp: number): { level: number; into: number; needed: number; pct: number } {
  let level = 1;
  while (xp >= xpForLevel(level + 1) && level < 99) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const into = xp - base;
  const needed = next - base;
  return { level, into, needed, pct: Math.min(100, Math.round((into / needed) * 100)) };
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Consecutive days (ending today or yesterday) with at least one session. */
export function dayStreak(rows: SessionRow[]): number {
  const days = new Set(rows.map((r) => dayKey(r.created_at)));
  if (days.size === 0) return 0;
  const today = new Date();
  const cursor = new Date(today);
  if (!days.has(dayKey(cursor.toISOString()))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor.toISOString()))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor.toISOString()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function startOfWeek(now = new Date()): Date {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7; // Monday start
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function thisWeek(rows: SessionRow[]): SessionRow[] {
  const from = startOfWeek().getTime();
  return rows.filter((r) => new Date(r.created_at).getTime() >= from);
}

export interface ModeBest {
  mode: string;
  sessions: number;
  bestAccuracy: number;
  bestLevel: number;
  lastAccuracy: number | null;
  xp: number;
}

export function bestsByMode(rows: SessionRow[]): Record<string, ModeBest> {
  const out: Record<string, ModeBest> = {};
  for (const r of rows) {
    const key = r.mode || "soundscape";
    const cur =
      out[key] ?? { mode: key, sessions: 0, bestAccuracy: 0, bestLevel: 0, lastAccuracy: null, xp: 0 };
    cur.sessions += 1;
    cur.bestAccuracy = Math.max(cur.bestAccuracy, Number(r.accuracy) || 0);
    cur.bestLevel = Math.max(cur.bestLevel, Number(r.end_level) || 0);
    cur.lastAccuracy = Number(r.accuracy) || 0;
    cur.xp += Number(r.xp) || 0;
    out[key] = cur;
  }
  return out;
}

export function totalXp(rows: SessionRow[]): number {
  return rows.reduce((a, r) => a + (Number(r.xp) || 0), 0);
}

/** The mode with the weakest recent accuracy, or the one never tried. */
export function focusMode(rows: SessionRow[], allModes: string[]): string {
  const bests = bestsByMode(rows);
  const untried = allModes.find((m) => !bests[m]);
  if (untried) return untried;
  let worst = allModes[0] as string;
  let worstScore = Infinity;
  for (const m of allModes) {
    const b = bests[m];
    const score = b?.lastAccuracy ?? 0;
    if (score < worstScore) {
      worstScore = score;
      worst = m;
    }
  }
  return worst;
}
