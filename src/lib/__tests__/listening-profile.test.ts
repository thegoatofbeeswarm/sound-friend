import { describe, expect, test } from "bun:test";
import { averageThreshold, buildProfile, listeningScore, sessionAccuracyPct } from "../listening-profile";

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
