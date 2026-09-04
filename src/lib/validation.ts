/**
 * Validation dataset: pairs of clinic-measured thresholds and Audiomaxxer
 * screening thresholds at the same ear and frequency, so the app's accuracy
 * can be judged against the clinic rather than asserted.
 */

export interface PointRow {
  ear: string;
  frequency_hz: number;
  threshold_db: number;
}

export interface Pair {
  ear: string;
  frequency_hz: number;
  clinicDb: number;
  appDb: number;
  /** app − clinic. Positive = the app needed the tone louder. */
  diffDb: number;
}

export interface ValidationSummary {
  pairs: Pair[];
  /** Mean signed difference (bias). */
  biasDb: number | null;
  /** Mean absolute difference. */
  errorDb: number | null;
  /** Pearson correlation between clinic and app values. */
  correlation: number | null;
  /** Share of pairs within 10 dB of the clinic. */
  within10Pct: number | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function pairPoints(clinic: PointRow[], app: PointRow[]): Pair[] {
  const key = (p: PointRow) => `${p.ear}:${p.frequency_hz}`;
  const appMap = new Map<string, number[]>();
  for (const p of app) {
    const list = appMap.get(key(p)) ?? [];
    list.push(Number(p.threshold_db));
    appMap.set(key(p), list);
  }

  const pairs: Pair[] = [];
  for (const p of clinic) {
    const matches = appMap.get(key(p));
    if (!matches?.length) continue;
    const appDb = matches.reduce((s, n) => s + n, 0) / matches.length;
    const clinicDb = Number(p.threshold_db);
    pairs.push({
      ear: p.ear,
      frequency_hz: p.frequency_hz,
      clinicDb: round1(clinicDb),
      appDb: round1(appDb),
      diffDb: round1(appDb - clinicDb),
    });
  }
  return pairs.sort((a, b) => a.ear.localeCompare(b.ear) || a.frequency_hz - b.frequency_hz);
}

export function summarize(pairs: Pair[]): ValidationSummary {
  if (!pairs.length) {
    return { pairs, biasDb: null, errorDb: null, correlation: null, within10Pct: null };
  }
  const n = pairs.length;
  const bias = pairs.reduce((s, p) => s + p.diffDb, 0) / n;
  const err = pairs.reduce((s, p) => s + Math.abs(p.diffDb), 0) / n;
  const within = pairs.filter((p) => Math.abs(p.diffDb) <= 10).length / n;

  let correlation: number | null = null;
  if (n >= 3) {
    const mx = pairs.reduce((s, p) => s + p.clinicDb, 0) / n;
    const my = pairs.reduce((s, p) => s + p.appDb, 0) / n;
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    for (const p of pairs) {
      const dx = p.clinicDb - mx;
      const dy = p.appDb - my;
      sxy += dx * dy;
      sxx += dx * dx;
      syy += dy * dy;
    }
    correlation = sxx > 0 && syy > 0 ? Math.round((sxy / Math.sqrt(sxx * syy)) * 100) / 100 : null;
  }

  return {
    pairs,
    biasDb: round1(bias),
    errorDb: round1(err),
    correlation,
    within10Pct: Math.round(within * 100),
  };
}

export function agreementBand(errorDb: number): "close" | "fair" | "loose" {
  if (errorDb <= 10) return "close";
  if (errorDb <= 20) return "fair";
  return "loose";
}
