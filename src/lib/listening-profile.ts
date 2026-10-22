/**
 * The Listening Profile: five dimensions built from the data the app already
 * collects. Every dimension is a 0-100 score plus a confidence flag telling
 * the user whether we have enough evidence yet.
 */

export type DimensionId =
  | "sensitivity"
  | "speech"
  | "discrimination"
  | "attention"
  | "memory";

export interface Dimension {
  id: DimensionId;
  /** 0-100, or null when there is no data at all. */
  score: number | null;
  /** How much evidence backs the score. */
  evidence: "none" | "thin" | "solid";
  /** Where the number came from, as a translation key. */
  sourceKey: string;
  /** Number of contributing measurements. */
  samples: number;
}

export interface ProfileInput {
  /** Average pure-tone threshold of the most recent screening, in dB. */
  avgThresholdDb: number | null;
  /** Number of saved tone screenings. */
  toneTests: number;
  /** Most recent speech-in-noise score (0-100). */
  speechScore: number | null;
  /** Number of saved speech-in-noise tests. */
  speechTests: number;
  /** Training sessions, newest first. */
  sessions: SessionRow[];
  /** Average pure-tone threshold from an uploaded clinical audiogram, in dB HL. */
  clinicalAvgThresholdDb?: number | null;
  /** Number of uploaded clinical reports with thresholds. */
  clinicalReports?: number;
  /** Which source the sensitivity dimension should use. */
  sensitivitySource?: SensitivitySource;
}

export type SensitivitySource = "app" | "clinical";

/** Plausible audiogram range in dB; anything outside is a parsing error, not a reading. */
const THRESHOLD_MIN_DB = -20;
const THRESHOLD_MAX_DB = 130;

/**
 * Average of every threshold point on an audiogram, ignoring blanks.
 * null, undefined, "" and whitespace are skipped before conversion, because
 * Number(null) and Number("") are both 0, which would read as a measured 0 dB.
 * A real numeric 0 still counts.
 */
export function averageThreshold(
  points: { threshold_db: number | string | null | undefined }[],
): number | null {
  const values = points
    .map((p) => p.threshold_db)
    .filter((v): v is number | string => v != null && !(typeof v === "string" && v.trim() === ""))
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n >= THRESHOLD_MIN_DB && n <= THRESHOLD_MAX_DB);
  if (!values.length) return null;
  return values.reduce((s, n) => s + n, 0) / values.length;
}

/** One saved training session as the profile reads it. */
export interface SessionRow {
  mode: string;
  /** Stored accuracy. Current rows hold a percentage (0-100); early rows may hold a fraction. */
  accuracy: number;
  end_level: number;
  /** Rounds and correct answers, when stored. These settle the accuracy unambiguously. */
  rounds?: number | null | undefined;
  correct?: number | null | undefined;
}

/**
 * Accuracy of one session as a percentage, normalised per row before any
 * averaging. correct/rounds wins whenever it is available, since it carries
 * no unit ambiguity. Without it, a value in (0, 1) is read as a fraction and
 * anything else as a percentage; a stored 1 without rounds stays ambiguous
 * and is read as 1%.
 */
export function sessionAccuracyPct(row: SessionRow): number | null {
  const rounds = Number(row.rounds);
  const correct = Number(row.correct);
  if (Number.isFinite(rounds) && rounds > 0 && Number.isFinite(correct) && correct >= 0 && correct <= rounds) {
    return (correct / rounds) * 100;
  }
  const acc = Number(row.accuracy);
  if (!Number.isFinite(acc) || acc < 0 || acc > 100) return null;
  return acc > 0 && acc < 1 ? acc * 100 : acc;
}

/** Modes that feed each trained dimension. */
const MODE_MAP: Record<Exclude<DimensionId, "sensitivity" | "speech">, string[]> = {
  discrimination: ["frequency-discrimination", "high-frequency", "phone-call"],
  attention: ["soundscape", "localization", "street"],
  memory: ["rapid-speech", "conversation", "restaurant"],
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * A trained dimension blends how accurate you are with how hard the material
 * was, so grinding an easy level does not max the score.
 */
function trainedScore(sessions: SessionRow[]): number | null {
  const recent = sessions
    .slice(0, 6)
    .map((r) => ({ acc: sessionAccuracyPct(r), level: Number(r.end_level) }))
    .filter((r): r is { acc: number; level: number } => r.acc != null && Number.isFinite(r.level));
  if (!recent.length) return null;
  const accPct = recent.reduce((s, r) => s + r.acc, 0) / recent.length;
  const level = recent.reduce((s, r) => s + r.level, 0) / recent.length;
  const levelFactor = 0.55 + Math.min(10, Math.max(1, level)) * 0.045; // 1 -> 0.6, 10 -> 1.0
  return clamp(accPct * levelFactor);
}

function evidenceOf(samples: number): Dimension["evidence"] {
  if (samples === 0) return "none";
  if (samples < 3) return "thin";
  return "solid";
}

export function buildProfile(input: ProfileInput): Dimension[] {
  const clinicalReports = input.clinicalReports ?? 0;
  const useClinical =
    input.sensitivitySource === "clinical" &&
    clinicalReports > 0 &&
    input.clinicalAvgThresholdDb != null;

  const rawDb = useClinical ? input.clinicalAvgThresholdDb! : input.avgThresholdDb;
  const sensitivity: Dimension = {
    id: "sensitivity",
    score: rawDb == null ? null : clamp(100 - Math.max(0, rawDb) * 1.5),
    // A clinical audiogram is measured under controlled conditions, so one
    // report already counts as solid evidence.
    evidence: useClinical ? "solid" : evidenceOf(input.toneTests),
    sourceKey: useClinical ? "profile.source.clinic" : "profile.source.tone",
    samples: useClinical ? clinicalReports : input.toneTests,
  };

  const speech: Dimension = {
    id: "speech",
    score: input.speechScore,
    evidence: evidenceOf(input.speechTests),
    sourceKey: "profile.source.speech",
    samples: input.speechTests,
  };

  const trained = (Object.keys(MODE_MAP) as (keyof typeof MODE_MAP)[]).map<Dimension>((id) => {
    const mine = input.sessions.filter((s) => MODE_MAP[id].includes(s.mode));
    return {
      id,
      score: mine.length ? trainedScore(mine) : null,
      evidence: evidenceOf(mine.length),
      sourceKey: `profile.source.${id}`,
      samples: mine.length,
    };
  });

  return [sensitivity, speech, ...trained];
}

/** Overall Listening Score: the mean of whatever dimensions we can measure. */
export function listeningScore(dims: Dimension[]): number | null {
  const known = dims.filter((d) => d.score != null).map((d) => d.score as number);
  if (known.length === 0) return null;
  return Math.round(known.reduce((s, n) => s + n, 0) / known.length);
}

/** The measured dimension with the lowest score — what training should target. */
export function weakestDimension(dims: Dimension[]): Dimension | null {
  const known = dims.filter((d) => d.score != null);
  if (known.length === 0) return null;
  return known.reduce((a, b) => ((b.score as number) < (a.score as number) ? b : a));
}

export function bandOf(score: number): "strong" | "typical" | "watch" | "low" {
  if (score >= 80) return "strong";
  if (score >= 60) return "typical";
  if (score >= 40) return "watch";
  return "low";
}

/** Where to send the user to improve a given dimension. */
export const DIMENSION_ACTION: Record<DimensionId, { to: "/test" | "/speech" | "/train"; labelKey: string }> = {
  sensitivity: { to: "/test", labelKey: "profile.act.tone" },
  speech: { to: "/speech", labelKey: "profile.act.speech" },
  discrimination: { to: "/train", labelKey: "profile.act.train" },
  attention: { to: "/train", labelKey: "profile.act.train" },
  memory: { to: "/train", labelKey: "profile.act.train" },
};

/* ------------------------------------------------------------------ */
/* Longitudinal listening score                                        */
/* ------------------------------------------------------------------ */

export interface TimelineInput {
  tone: { created_at: string; avg_threshold_db: number | null }[];
  speech: { created_at: string; score: number }[];
  sessions: (SessionRow & { created_at: string })[];
}

export interface TimelinePoint {
  /** ISO date of the week bucket. */
  date: string;
  score: number;
  /** How many of the five skills the score averaged at this point. */
  coverage: number;
}

/**
 * Recompute the overall listening score at each week that has new data, using
 * only what had been measured by that point. That makes the line a real
 * history rather than a redraw of today's numbers.
 */
export function listeningTimeline(input: TimelineInput, maxPoints = 16): TimelinePoint[] {
  const stamps = [
    ...input.tone.map((r) => r.created_at),
    ...input.speech.map((r) => r.created_at),
    ...input.sessions.map((r) => r.created_at),
  ].filter(Boolean);
  if (!stamps.length) return [];

  const weekEnd = (iso: string) => {
    const d = new Date(iso);
    const day = d.getUTCDay();
    const add = (7 - day) % 7;
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + add));
    return end.toISOString().slice(0, 10);
  };

  const weeks = [...new Set(stamps.map(weekEnd))].sort();

  const points = weeks
    .map<TimelinePoint | null>((week) => {
      const cutoff = `${week}T23:59:59.999Z`;
      const tone = input.tone.filter((r) => r.created_at <= cutoff);
      const speech = input.speech.filter((r) => r.created_at <= cutoff);
      const sessions = input.sessions.filter((r) => r.created_at <= cutoff);
      const newestTone = tone.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      const newestSpeech = speech.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      const dims = buildProfile({
          avgThresholdDb: newestTone?.avg_threshold_db ?? null,
          toneTests: tone.length,
          speechScore: newestSpeech?.score ?? null,
          speechTests: speech.length,
          sessions: [...sessions]
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .map((s) => ({ mode: s.mode, accuracy: s.accuracy, end_level: s.end_level, rounds: s.rounds, correct: s.correct })),
      });
      const score = listeningScore(dims);
      const coverage = dims.filter((d) => d.score != null).length;
      return score == null ? null : { date: week, score, coverage };
    })
    .filter(Boolean) as TimelinePoint[];

  return points.slice(-maxPoints);
}
