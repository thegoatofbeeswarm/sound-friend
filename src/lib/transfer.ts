/**
 * Transfer testing: does practice carry over to material you never trained on?
 *
 * Ordinary sessions only ever draw from the "train" half of every item bank.
 * A transfer check runs at a fixed difficulty on the held-out half, so the
 * gap between the two accuracies is a real generalisation measure rather than
 * a memory of the same sentences.
 */

export const TRANSFER_ROUNDS = 8;

export interface SessionLike {
  mode: string;
  kind?: string | null;
  accuracy: number;
  end_level: number;
  created_at: string;
}

export interface TransferStat {
  mode: string;
  trainAccuracy: number | null;
  trainSessions: number;
  /** Average difficulty reached in recent training — the level a check runs at. */
  trainLevel: number;
  transferAccuracy: number | null;
  transferSessions: number;
  /** transfer − training, in accuracy points. Negative = did not carry over. */
  gap: number | null;
  /** Enough training behind it to make a check meaningful. */
  ready: boolean;
}

const isTransfer = (row: SessionLike) => row.kind === "transfer";

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

/** Newest first within each mode. */
export function transferByMode(rows: SessionLike[]): TransferStat[] {
  const sorted = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const modes = [...new Set(sorted.map((r) => r.mode))];

  return modes
    .map<TransferStat>((mode) => {
      const mine = sorted.filter((r) => r.mode === mode);
      const trained = mine.filter((r) => !isTransfer(r)).slice(0, 3);
      const checked = mine.filter(isTransfer).slice(0, 3);
      const trainAccuracy = mean(trained.map((r) => Number(r.accuracy)));
      const transferAccuracy = mean(checked.map((r) => Number(r.accuracy)));
      const levels = trained.map((r) => Number(r.end_level));
      const trainLevel = levels.length
        ? Math.max(1, Math.min(10, Math.round((levels.reduce((s, n) => s + n, 0) / levels.length) * 10) / 10))
        : 3;
      return {
        mode,
        trainAccuracy,
        trainSessions: mine.filter((r) => !isTransfer(r)).length,
        trainLevel,
        transferAccuracy,
        transferSessions: checked.length,
        gap:
          trainAccuracy == null || transferAccuracy == null ? null : transferAccuracy - trainAccuracy,
        ready: mine.filter((r) => !isTransfer(r)).length >= 2,
      };
    })
    .sort((a, b) => b.trainSessions - a.trainSessions);
}

export type TransferVerdict = "held" | "partial" | "notYet" | "unknown";

export function verdictOf(stat: TransferStat): TransferVerdict {
  if (stat.gap == null) return "unknown";
  if (stat.gap >= -8) return "held";
  if (stat.gap >= -20) return "partial";
  return "notYet";
}
