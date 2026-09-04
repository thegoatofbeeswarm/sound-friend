/**
 * Clinic-anchored training plan.
 *
 * Takes whatever evidence we have — an uploaded clinic audiogram first, then
 * the in-browser screening, the speech-in-noise test and past training — and
 * turns it into an ordered list of training tracks with a plain reason for
 * each one. The clinic report always wins when it is present: it is the most
 * trustworthy measurement the user has.
 */

import type { ModeId } from "./training-modes";

export type PlanPoint = { ear: string; frequency_hz: number; threshold_db: number };

export type PlanInput = {
  clinicPoints: PlanPoint[];
  clinicLabel: string | null;
  screeningPoints: PlanPoint[];
  sinScore: number | null;
  /** Mode ids already trained, most-trained first is not required. */
  trainedModes: ModeId[];
};

export type PlanStep = {
  mode: ModeId;
  /** i18n key for the reason line. */
  reasonKey: string;
  /** Interpolation values for the reason line. */
  vals?: Record<string, string | number>;
};

export type TrainingPlan = {
  source: "clinic" | "screening" | "none";
  sourceLabel: string | null;
  /** Mean threshold at 4 kHz and above, in dB, or null when unknown. */
  highDb: number | null;
  /** Mean threshold below 2 kHz, in dB, or null when unknown. */
  lowDb: number | null;
  /** Difference between ears at high frequencies, in dB. */
  asymmetryDb: number | null;
  steps: PlanStep[];
};

const HIGH_HZ = 4000;
const LOW_HZ = 2000;

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function bandMeans(points: PlanPoint[]) {
  const high = mean(points.filter((p) => p.frequency_hz >= HIGH_HZ).map((p) => p.threshold_db));
  const low = mean(points.filter((p) => p.frequency_hz < LOW_HZ).map((p) => p.threshold_db));
  const leftHigh = mean(
    points.filter((p) => p.frequency_hz >= HIGH_HZ && p.ear === "left").map((p) => p.threshold_db),
  );
  const rightHigh = mean(
    points.filter((p) => p.frequency_hz >= HIGH_HZ && p.ear === "right").map((p) => p.threshold_db),
  );
  const asymmetry =
    leftHigh == null || rightHigh == null ? null : Math.abs(leftHigh - rightHigh);
  return { high, low, asymmetry };
}

const round = (value: number) => Math.round(value);

export function buildTrainingPlan(input: PlanInput): TrainingPlan {
  const useClinic = input.clinicPoints.length > 0;
  const points = useClinic ? input.clinicPoints : input.screeningPoints;
  const source: TrainingPlan["source"] = useClinic
    ? "clinic"
    : input.screeningPoints.length
      ? "screening"
      : "none";
  const { high, low, asymmetry } = bandMeans(points);

  const steps: PlanStep[] = [];
  const add = (mode: ModeId, reasonKey: string, vals?: Record<string, string | number>) => {
    if (steps.some((step) => step.mode === mode)) return;
    steps.push({ mode, reasonKey, vals });
  };

  // 1. High-frequency loss is the usual first finding and the consonants that
  //    live up there are what makes speech hard to follow.
  if (high != null && high >= 20) {
    add("high-frequency", "plan.reason.highLoss", { db: round(high) });
    add("speech-in-noise", "plan.reason.consonants");
  }

  // 2. Speech in noise is weak even when the tones look fine.
  if (input.sinScore != null && input.sinScore < 60) {
    add("speech-in-noise", "plan.reason.sinWeak", { score: input.sinScore });
    add("conversation", "plan.reason.followTalk");
  }

  // 3. One ear clearly behind the other -> localization work.
  if (asymmetry != null && asymmetry >= 10) {
    add("localization", "plan.reason.asymmetry", { db: round(asymmetry) });
  }

  // 4. Low frequencies raised too -> broader sensitivity work.
  if (low != null && low >= 25) {
    add("soundscape", "plan.reason.lowLoss", { db: round(low) });
  }

  // 5. Nothing alarming, or not enough evidence: build the general skills.
  add("speech-in-noise", "plan.reason.general");
  add("frequency-discrimination", "plan.reason.discrimination");
  add("rapid-speech", "plan.reason.memory");

  // Push tracks the user has never tried slightly forward within the tail so
  // the plan does not just repeat the same track every week.
  const trained = new Set(input.trainedModes);
  const head = steps.slice(0, 2);
  const tail = steps
    .slice(2)
    .sort((a, b) => Number(trained.has(a.mode)) - Number(trained.has(b.mode)));

  return {
    source,
    sourceLabel: useClinic ? input.clinicLabel : null,
    highDb: high == null ? null : round(high),
    lowDb: low == null ? null : round(low),
    asymmetryDb: asymmetry == null ? null : round(asymmetry),
    steps: [...head, ...tail].slice(0, 3),
  };
}
