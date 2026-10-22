import { describe, expect, test } from "bun:test";
import {
  averageThreshold,
  buildProfile,
  listeningScore,
  listeningTimeline,
  profileChange,
  sessionAccuracyPct,
} from "../listening-profile";

describe("averageThreshold", () => {
  test("ignores null and blank points instead of reading them as 0 dB", () => {
    expect(averageThreshold([{ threshold_db: null }, { threshold_db: 20 }])).toBe(20);
    expect(averageThreshold([{ threshold_db: "" }, { threshold_db: 20 }])).toBe(20);
    expect(averageThreshold([{ threshold_db: "   " }, { threshold_db: "20" }])).toBe(20);
    expect(averageThreshold([{ threshold_db: undefined }, { threshold_db: 20 }])).toBe(20);
  });

  test("returns null when every point is blank", () => {
    expect(averageThreshold([{ threshold_db: null }, { threshold_db: "" }])).toBeNull();
    expect(averageThreshold([])).toBeNull();
  });

  test("keeps a genuinely measured 0 dB", () => {
    expect(averageThreshold([{ threshold_db: 0 }, { threshold_db: 20 }])).toBe(10);
    expect(averageThreshold([{ threshold_db: "0" }])).toBe(0);
  });

  test("drops values outside the audiogram range", () => {
    expect(averageThreshold([{ threshold_db: 999 }, { threshold_db: 20 }])).toBe(20);
    expect(averageThreshold([{ threshold_db: "abc" }, { threshold_db: 30 }])).toBe(30);
  });
});

describe("sessionAccuracyPct", () => {
  test("prefers correct/rounds over the stored accuracy", () => {
    expect(sessionAccuracyPct({ mode: "x", accuracy: 0.8, end_level: 5, rounds: 10, correct: 8 })).toBe(80);
    expect(sessionAccuracyPct({ mode: "x", accuracy: 80, end_level: 5, rounds: 10, correct: 8 })).toBe(80);
  });

  test("reads historical fractions and current percentages without rounds", () => {
    expect(sessionAccuracyPct({ mode: "x", accuracy: 0.8, end_level: 5 })).toBe(80);
    expect(sessionAccuracyPct({ mode: "x", accuracy: 80, end_level: 5 })).toBe(80);
    expect(sessionAccuracyPct({ mode: "x", accuracy: 0, end_level: 5 })).toBe(0);
    expect(sessionAccuracyPct({ mode: "x", accuracy: 100, end_level: 5 })).toBe(100);
  });

  test("rejects malformed rows", () => {
    expect(sessionAccuracyPct({ mode: "x", accuracy: Number.NaN, end_level: 5 })).toBeNull();
    expect(sessionAccuracyPct({ mode: "x", accuracy: 140, end_level: 5 })).toBeNull();
    expect(sessionAccuracyPct({ mode: "x", accuracy: -3, end_level: 5 })).toBeNull();
  });
});

describe("trained dimension scores", () => {
  const base = { avgThresholdDb: null, toneTests: 0, speechScore: null, speechTests: 0 };

  test("mixed fraction and percentage rows both count as 80%", () => {
    const dims = buildProfile({
      ...base,
      sessions: [
        { mode: "frequency-discrimination", accuracy: 0.8, end_level: 10 },
        { mode: "frequency-discrimination", accuracy: 80, end_level: 10 },
      ],
    });
    expect(dims.find((d) => d.id === "discrimination")?.score).toBe(80);
  });

  test("a dimension with only malformed rows stays unmeasured, not zero", () => {
    const dims = buildProfile({
      ...base,
      sessions: [{ mode: "frequency-discrimination", accuracy: Number.NaN, end_level: 10 }],
    });
    expect(dims.find((d) => d.id === "discrimination")?.score).toBeNull();
    expect(listeningScore(dims)).toBeNull();
  });
});

describe("re-audit: missing values and evidence", () => {
  test("a missing correct count falls back to the stored accuracy", () => {
    expect(sessionAccuracyPct({ mode: "x", accuracy: 80, end_level: 5, rounds: 10, correct: null })).toBe(80);
  });

  test("missing accuracy with no counts stays unmeasured, not 0%", () => {
    expect(sessionAccuracyPct({ mode: "x", accuracy: null as unknown as number, end_level: 5 })).toBeNull();
    expect(sessionAccuracyPct({ mode: "x", accuracy: "" as unknown as number, end_level: 5 })).toBeNull();
  });

  test("unusable rows don't count as evidence", () => {
    const dims = buildProfile({
      avgThresholdDb: null,
      toneTests: 0,
      speechScore: null,
      speechTests: 0,
      sessions: [
        { mode: "frequency-discrimination", accuracy: Number.NaN, end_level: 5 },
        { mode: "frequency-discrimination", accuracy: null as unknown as number, end_level: 5 },
        { mode: "frequency-discrimination", accuracy: 140, end_level: 5 },
      ],
    });
    const d = dims.find((x) => x.id === "discrimination")!;
    expect(d.score).toBeNull();
    expect(d.samples).toBe(0);
    expect(d.evidence).toBe("none");
  });
});

describe("re-audit: score changes are like-for-like", () => {
  test("adding a first speech score is not reported as a decline", () => {
    const timeline = listeningTimeline({
      tone: [{ created_at: "2026-09-01T10:00:00Z", avg_threshold_db: 10 }],
      speech: [{ created_at: "2026-09-20T10:00:00Z", score: 40 }],
      sessions: [],
    });
    expect(timeline.map((p) => p.score)).toEqual([85, 63]);
    const c = profileChange(timeline);
    expect(c.change).toBeNull();
    expect(c.expanded).toBe(true);
  });

  test("a change is measured within the stretch that covers the same skills", () => {
    const timeline = listeningTimeline({
      tone: [
        { created_at: "2026-09-01T10:00:00Z", avg_threshold_db: 10 },
        { created_at: "2026-10-10T10:00:00Z", avg_threshold_db: 20 },
      ],
      speech: [{ created_at: "2026-09-20T10:00:00Z", score: 40 }],
      sessions: [],
    });
    const c = profileChange(timeline);
    // 85 -> 63 (speech added) is excluded; 63 -> 55 (tone moved, same skills) counts.
    expect(c.change).toBe(timeline[timeline.length - 1]!.score - timeline[1]!.score);
    expect(c.expanded).toBe(true);
  });

  test("an unchanged set of skills compares first to last", () => {
    const timeline = listeningTimeline({
      tone: [
        { created_at: "2026-09-01T10:00:00Z", avg_threshold_db: 10 },
        { created_at: "2026-10-10T10:00:00Z", avg_threshold_db: 20 },
      ],
      speech: [],
      sessions: [],
    });
    const c = profileChange(timeline);
    expect(c.change).toBe(70 - 85);
    expect(c.expanded).toBe(false);
  });
});
