/**
 * Screening quality scoring.
 *
 * A hearing screening run in a noisy room, on uncalibrated headphones, or cut
 * short is still useful for tracking relative change, but its absolute
 * thresholds are less trustworthy. This module turns those conditions into a
 * transparent 0-100 quality score with plain-language reasons, so results are
 * never presented as more precise than the conditions allow.
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
}

export type QualityTier = "excellent" | "good" | "fair" | "low";

export interface QualityResult {
  score: number;
  tier: QualityTier;
  label: string;
  /** Things that held the score back, most important first. */
  issues: string[];
  /** Things that went well. */
  strengths: string[];
  /** One-line summary of how to read the numbers. */
  interpretation: string;
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
  const strengths: string[] = [];
  let score = 100;

  // Room noise: quiet rooms sit near 30 dB; above ~45 dB low-frequency
  // thresholds start being masked.
  const env = input.environmentDb;
  if (env == null) {
    score -= 12;
    issues.push("Room noise was not measured before the screening.");
  } else if (env <= 35) {
    strengths.push(`Very quiet room (~${Math.round(env)} dB).`);
  } else if (env <= 45) {
    score -= 8;
    strengths.push(`Reasonably quiet room (~${Math.round(env)} dB).`);
  } else if (env <= 55) {
    score -= 20;
    issues.push(`Background noise was ~${Math.round(env)} dB, which can mask the quietest tones.`);
  } else {
    score -= 34;
    issues.push(`Background noise was ~${Math.round(env)} dB — too loud for reliable low-level tones.`);
  }

  // Device calibration.
  const device = input.device ? getDevice(input.device as DeviceId) : null;
  if (!device) {
    score -= 12;
    issues.push("No listening device was recorded for this screening.");
  } else if (device.calibrated) {
    strengths.push(`${device.label} has a calibration profile applied.`);
  } else {
    score -= 18;
    issues.push(`${device.label} is uncalibrated, so absolute levels may be off by several dB.`);
  }

  // Trial count: the adaptive engine needs enough answers per track.
  if (input.trials >= 30) {
    strengths.push(`${input.trials} trials answered.`);
  } else if (input.trials >= 20) {
    score -= 6;
  } else if (input.trials > 0) {
    score -= 18;
    issues.push(`Only ${input.trials} trials were answered, so estimates stayed coarse.`);
  } else {
    score -= 25;
    issues.push("No trials recorded.");
  }

  // Posterior confidence across frequency/ear tracks.
  const conf = input.confidences.filter((c) => Number.isFinite(c));
  if (conf.length > 0) {
    const avg = conf.reduce((a, b) => a + b, 0) / conf.length;
    const weakest = Math.min(...conf);
    if (avg >= 0.8) {
      strengths.push(`Average estimate confidence ${Math.round(avg * 100)}%.`);
    } else if (avg >= 0.65) {
      score -= 8;
    } else {
      score -= 18;
      issues.push(`Average estimate confidence was only ${Math.round(avg * 100)}%.`);
    }
    if (weakest < 0.5) {
      score -= 6;
      issues.push("At least one frequency never settled — answers there may have been inconsistent.");
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

  return { score, tier, label: QUALITY_LABEL[tier], issues, strengths, interpretation };
}

export function qualityTone(tier: QualityTier): "ok" | "watch" | "risk" {
  if (tier === "excellent" || tier === "good") return "ok";
  if (tier === "fair") return "watch";
  return "risk";
}
