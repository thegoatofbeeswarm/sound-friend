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
  sessions: { mode: string; accuracy: number; end_level: number }[];
}

/** Modes that feed each trained dimension. */
const MODE_MAP: Record<Exclude<DimensionId, "sensitivity" | "speech">, string[]> = {
  discrimination: ["frequency-discrimination", "high-frequency"],
  attention: ["soundscape", "localization"],
  memory: ["rapid-speech", "conversation"],
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * A trained dimension blends how accurate you are with how hard the material
 * was, so grinding an easy level does not max the score.
 */
function trainedScore(sessions: { accuracy: number; end_level: number }[]): number {
  const recent = sessions.slice(0, 6);
  const acc = recent.reduce((s, r) => s + r.accuracy, 0) / recent.length;
  const level = recent.reduce((s, r) => s + r.end_level, 0) / recent.length;
  // accuracy is 0..1 in storage for some rows and 0..100 for others; normalise.
  const accPct = acc <= 1 ? acc * 100 : acc;
  const levelFactor = 0.55 + Math.min(10, Math.max(1, level)) * 0.045; // 1 -> 0.6, 10 -> 1.0
  return clamp(accPct * levelFactor);
}

function evidenceOf(samples: number): Dimension["evidence"] {
  if (samples === 0) return "none";
  if (samples < 3) return "thin";
  return "solid";
}

export function buildProfile(input: ProfileInput): Dimension[] {
  const sensitivity: Dimension = {
    id: "sensitivity",
    score:
      input.avgThresholdDb == null ? null : clamp(100 - Math.max(0, input.avgThresholdDb) * 1.5),
    evidence: evidenceOf(input.toneTests),
    sourceKey: "profile.source.tone",
    samples: input.toneTests,
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
export const DIMENSION_ACTION: Record<DimensionId, { to: string; labelKey: string }> = {
  sensitivity: { to: "/test", labelKey: "profile.act.tone" },
  speech: { to: "/speech", labelKey: "profile.act.speech" },
  discrimination: { to: "/train", labelKey: "profile.act.train" },
  attention: { to: "/train", labelKey: "profile.act.train" },
  memory: { to: "/train", labelKey: "profile.act.train" },
};
