/**
 * Screening quality scoring.
 *
 * A hearing screening run in a noisy room, on uncalibrated headphones, or cut
 * short is still useful for tracking relative change, but its absolute
 * thresholds are less trustworthy. This module turns those conditions into a
 * transparent 0-100 quality score with plain-language reasons, so results are
 * never presented as more precise than the conditions allow.
 *
 * Every message is emitted twice: as an English string (used for AI prompts and
 * any non-localized surface) and as a translation key plus values, so the UI can
 * render it in the user's language.
 */

import { getDevice, type DeviceId } from "@/lib/devices";

export interface QualityInput {
  /** Measured room noise in dB SPL, if the user ran the noise scan. */
  environmentDb: number | null;
  /** Number of trials answered in the screening. */
  trials: number;
  /** Per-point posterior confidence values (0-1). */
  confidences: number[];
  /** Listening device used for the screening. */
  device: DeviceId | string | null;
  /** Silent catch trials presented (no tone played). */
  catchTrials?: number;
  /** Catch trials the user correctly reported as silent. */
  catchPassed?: number;
  /** Repeated trials used to check answer consistency. */
  repeatTrials?: number;
  /** Repeated trials answered the same way as the first time. */
  repeatAgreed?: number;
}

export type QualityTier = "excellent" | "good" | "fair" | "low";

/** A localizable message: translation key plus interpolation values. */
export interface QualityMessage {
  key: string;
  vals?: Record<string, string | number> | undefined;
}

export interface QualityResult {
  score: number;
  tier: QualityTier;
  label: string;
  labelKey: string;
  /** Things that held the score back, most important first. */
  issues: string[];
  issueItems: QualityMessage[];
  /** Things that went well. */
  strengths: string[];
  strengthItems: QualityMessage[];
  /** One-line summary of how to read the numbers. */
  interpretation: string;
  interpretationKey: string;
}

export const QUALITY_LABEL: Record<QualityTier, string> = {
  excellent: "Excellent conditions",
  good: "Good conditions",
  fair: "Fair conditions",
  low: "Limited reliability",
};

function tierFor(score: number): QualityTier {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "low";
}

export function scoreScreening(input: QualityInput): QualityResult {
  const issues: string[] = [];
  const issueItems: QualityMessage[] = [];
  const strengths: string[] = [];
  const strengthItems: QualityMessage[] = [];
  let score = 100;

  const issue = (text: string, key: string, vals?: Record<string, string | number>) => {
    issues.push(text);
    issueItems.push({ key, vals });
  };
  const strength = (text: string, key: string, vals?: Record<string, string | number>) => {
    strengths.push(text);
    strengthItems.push({ key, vals });
  };

  // Room noise: quiet rooms sit near 30 dB; above ~45 dB low-frequency
  // thresholds start being masked.
  const env = input.environmentDb;
  if (env == null) {
    score -= 12;
    issue("Room noise was not measured before the screening.", "quality.issue.noNoiseScan");
  } else if (env <= 35) {
    strength(`Very quiet room (~${Math.round(env)} dB).`, "quality.strength.veryQuiet", {
      db: Math.round(env),
    });
  } else if (env <= 45) {
    score -= 8;
    strength(`Reasonably quiet room (~${Math.round(env)} dB).`, "quality.strength.quiet", {
      db: Math.round(env),
    });
  } else if (env <= 55) {
    score -= 20;
    issue(
      `Background noise was ~${Math.round(env)} dB, which can mask the quietest tones.`,
      "quality.issue.noisy",
      { db: Math.round(env) },
    );
  } else {
    score -= 34;
    issue(
      `Background noise was ~${Math.round(env)} dB — too loud for reliable low-level tones.`,
      "quality.issue.veryNoisy",
      { db: Math.round(env) },
    );
  }

  // Device calibration.
  const device = input.device ? getDevice(input.device as DeviceId) : null;
  if (!device) {
    score -= 12;
    issue("No listening device was recorded for this screening.", "quality.issue.noDevice");
  } else if (device.calibrated) {
    strength(`${device.label} has a calibration profile applied.`, "quality.strength.calibrated", {
      device: device.label,
    });
  } else {
    score -= 18;
    issue(
      `${device.label} is uncalibrated, so absolute levels may be off by several dB.`,
      "quality.issue.uncalibrated",
      { device: device.label },
    );
  }

  // Trial count: the adaptive engine needs enough answers per track.
  if (input.trials >= 30) {
    strength(`${input.trials} trials answered.`, "quality.strength.trials", { n: input.trials });
  } else if (input.trials >= 20) {
    score -= 6;
  } else if (input.trials > 0) {
    score -= 18;
    issue(
      `Only ${input.trials} trials were answered, so estimates stayed coarse.`,
      "quality.issue.fewTrials",
      { n: input.trials },
    );
  } else {
    score -= 25;
    issue("No trials recorded.", "quality.issue.noTrials");
  }

  // Posterior confidence across frequency/ear tracks.
  const conf = input.confidences.filter((c) => Number.isFinite(c));
  if (conf.length > 0) {
    const avg = conf.reduce((a, b) => a + b, 0) / conf.length;
    const weakest = Math.min(...conf);
    if (avg >= 0.8) {
      strength(
        `Average estimate confidence ${Math.round(avg * 100)}%.`,
        "quality.strength.confidence",
        { pct: Math.round(avg * 100) },
      );
    } else if (avg >= 0.65) {
      score -= 8;
    } else {
      score -= 18;
      issue(
        `Average estimate confidence was only ${Math.round(avg * 100)}%.`,
        "quality.issue.lowConfidence",
        { pct: Math.round(avg * 100) },
      );
    }
    if (weakest < 0.5) {
      score -= 6;
      issue(
        "At least one frequency never settled — answers there may have been inconsistent.",
        "quality.issue.unsettled",
      );
    }
  }

  // Silent catch trials: saying "I heard it" when nothing played means the
  // run picked up guesses or imagined tones.
  const catchTotal = input.catchTrials ?? 0;
  if (catchTotal > 0) {
    const passed = input.catchPassed ?? 0;
    const failed = catchTotal - passed;
    if (failed === 0) {
      strength(`Passed all ${catchTotal} silent catch trials.`, "quality.strength.catchPass", {
        n: catchTotal,
      });
    } else {
      score -= Math.min(30, failed * 12);
      issue(
        `Reported hearing a tone on ${failed} of ${catchTotal} silent catch trials.`,
        "quality.issue.catchFail",
        { failed, total: catchTotal },
      );
    }
  }

  // Repeat trials: the same tone asked twice should get the same answer.
  const repeatTotal = input.repeatTrials ?? 0;
  if (repeatTotal > 0) {
    const agreed = input.repeatAgreed ?? 0;
    const pct = Math.round((agreed / repeatTotal) * 100);
    if (pct >= 80) {
      strength(`Answers agreed on ${pct}% of repeated tones.`, "quality.strength.consistent", {
        pct,
      });
    } else if (pct >= 60) {
      score -= 8;
    } else {
      score -= 18;
      issue(
        `Repeated tones got the same answer only ${pct}% of the time.`,
        "quality.issue.inconsistent",
        { pct },
      );
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const tier = tierFor(score);

  const interpretation =
    tier === "excellent"
      ? "Absolute thresholds from this screening can be compared to standard ranges with confidence."
      : tier === "good"
        ? "Thresholds are dependable for tracking, with roughly a few dB of uncertainty."
        : tier === "fair"
          ? "Use this run for relative tracking; absolute thresholds may be shifted by conditions."
          : "Treat these numbers as indicative only and repeat the screening in better conditions.";

  return {
    score,
    tier,
    label: QUALITY_LABEL[tier],
    labelKey: `quality.label.${tier}`,
    issues,
    issueItems,
    strengths,
    strengthItems,
    interpretation,
    interpretationKey: `quality.interpretation.${tier}`,
  };
}

export function qualityTone(tier: QualityTier): "ok" | "watch" | "risk" {
  if (tier === "excellent" || tier === "good") return "ok";
  if (tier === "fair") return "watch";
  return "risk";
}
