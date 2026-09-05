/**
 * Validation dataset: pairs of clinic-measured thresholds and Audiomaxxer
 * screening thresholds at the same ear and frequency.
 *
 * IMPORTANT: a clinic audiogram is in dB HL from a calibrated audiometer; an
 * Audiomaxxer screening is a relative, device-dependent estimated level. The
 * two are not on the same scale, so a raw "mean absolute error" between them
 * would look scientifically meaningful when it is not. Everything below is
 * therefore built around SHAPE: do the two tests describe the same pattern
 * across frequency, once a constant scale offset is removed?
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
  /** app − clinic. Mixes a scale offset with real pattern differences. */
  diffDb: number;
  /** app − clinic with the constant scale offset removed: pattern deviation. */
  shapeDb: number;
}

export type AgreementBand = "strong" | "moderate" | "weak";

export interface PatternSummary {
  pairs: Pair[];
  n: number;
  /** Pearson correlation of the two curves: how similar the shapes are. */
  correlation: number | null;
  /** Median (app − clinic): the constant scale offset, NOT an error. */
  offsetDb: number | null;
  /** Mean absolute deviation once the offset is removed. */
  shapeSpreadDb: number | null;
  /** Share of points whose offset-corrected deviation is within 10 dB. */
  withinShapePct: number | null;
  agreement: AgreementBand | null;
  /** Frequency region each test finds hardest, for the plain-language line. */
  clinicWeakBand: FreqBand | null;
  appWeakBand: FreqBand | null;
  /** True when both tests point at the same region. */
  sameWeakBand: boolean;
}

export type FreqBand = "low" | "mid" | "high";

const round1 = (n: number) => Math.round(n * 10) / 10;

export function bandOfFrequency(hz: number): FreqBand {
  if (hz < 1000) return "low";
  if (hz < 4000) return "mid";
  return "high";
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] as number) : (((s[mid - 1] as number) + (s[mid] as number)) / 2);
}

/** The band with the highest mean threshold (i.e. the least sensitive region). */
function weakestBand(rows: { frequency_hz: number; value: number }[]): FreqBand | null {
  const sums: Record<FreqBand, { total: number; n: number }> = {
    low: { total: 0, n: 0 },
    mid: { total: 0, n: 0 },
    high: { total: 0, n: 0 },
  };
  for (const r of rows) {
    const b = bandOfFrequency(r.frequency_hz);
    sums[b].total += r.value;
    sums[b].n += 1;
  }
  const means = (Object.keys(sums) as FreqBand[])
    .filter((b) => sums[b].n > 0)
    .map((b) => ({ band: b, mean: sums[b].total / sums[b].n }));
  if (means.length < 2) return null;
  return means.reduce((a, b) => (b.mean > a.mean ? b : a)).band;
}

export function pairPoints(clinic: PointRow[], app: PointRow[]): Pair[] {
  const key = (p: PointRow) => `${p.ear}:${p.frequency_hz}`;
  const appMap = new Map<string, number[]>();
  for (const p of app) {
    const list = appMap.get(key(p)) ?? [];
    list.push(Number(p.threshold_db));
    appMap.set(key(p), list);
  }

  const raw: Omit<Pair, "shapeDb">[] = [];
  for (const p of clinic) {
    const matches = appMap.get(key(p));
    if (!matches?.length) continue;
    const appDb = matches.reduce((s, n) => s + n, 0) / matches.length;
    const clinicDb = Number(p.threshold_db);
    raw.push({
      ear: p.ear,
      frequency_hz: p.frequency_hz,
      clinicDb: round1(clinicDb),
      appDb: round1(appDb),
      diffDb: round1(appDb - clinicDb),
    });
  }

  const offset = raw.length ? median(raw.map((r) => r.diffDb)) : 0;

  return raw
    .map<Pair>((r) => ({ ...r, shapeDb: round1(r.diffDb - offset) }))
    .sort((a, b) => a.ear.localeCompare(b.ear) || a.frequency_hz - b.frequency_hz);
}

export function patternSummary(pairs: Pair[]): PatternSummary {
  if (!pairs.length) {
    return {
      pairs,
      n: 0,
      correlation: null,
      offsetDb: null,
      shapeSpreadDb: null,
      withinShapePct: null,
      agreement: null,
      clinicWeakBand: null,
      appWeakBand: null,
      sameWeakBand: false,
    };
  }

  const n = pairs.length;
  const offset = round1(median(pairs.map((p) => p.diffDb)));
  const spread = round1(pairs.reduce((s, p) => s + Math.abs(p.shapeDb), 0) / n);
  const within = Math.round((pairs.filter((p) => Math.abs(p.shapeDb) <= 10).length / n) * 100);

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

  const clinicWeakBand = weakestBand(
    pairs.map((p) => ({ frequency_hz: p.frequency_hz, value: p.clinicDb })),
  );
  const appWeakBand = weakestBand(
    pairs.map((p) => ({ frequency_hz: p.frequency_hz, value: p.appDb })),
  );

  let agreement: AgreementBand | null = null;
  if (correlation != null) {
    if (correlation >= 0.8 && spread <= 10) agreement = "strong";
    else if (correlation >= 0.5 && spread <= 18) agreement = "moderate";
    else agreement = "weak";
  }

  return {
    pairs,
    n,
    correlation,
    offsetDb: offset,
    shapeSpreadDb: spread,
    withinShapePct: within,
    agreement,
    clinicWeakBand,
    appWeakBand,
    sameWeakBand: !!clinicWeakBand && clinicWeakBand === appWeakBand,
  };
}
