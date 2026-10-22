import { describe, expect, test } from "bun:test";
import { createTrainer, MIN_LEVEL, scoreRound } from "../soundscapes";

const round = { levelDb: 40 };
const run = (answers: boolean[], start = 3, fixed = false) =>
  answers.reduce((s, c) => scoreRound(s, round, c, { fixed }), createTrainer(start));

describe("adaptive trainer", () => {
  test("twelve wrong answers make it easier, not harder", () => {
    const levels: number[] = [];
    let s = createTrainer(3);
    for (let i = 0; i < 12; i++) {
      s = scoreRound(s, round, false);
      levels.push(s.level);
    }
    // Previously: 3 -> 5.64 because a rising floor overrode the step down.
    expect(s.level).toBe(MIN_LEVEL);
    for (let i = 1; i < levels.length; i++) expect(levels[i]!).toBeLessThanOrEqual(levels[i - 1]!);
  });

  test("a single lucky answer moves the level by one small step", () => {
    const s = run([true]);
    expect(s.level).toBeCloseTo(3.5, 5);
  });

  test("steps get bigger only after three correct in a row", () => {
    expect(run([true, true]).level).toBeCloseTo(4, 5);
    expect(run([true, true, true]).level).toBeCloseTo(4.9, 5);
  });

  test("a miss after a streak brings the level back down", () => {
    expect(run([true, true, true, false]).level).toBeCloseTo(4.1, 5);
  });

  test("alternating answers do not ratchet the level upward", () => {
    const s = run(Array.from({ length: 12 }, (_, i) => i % 2 === 0));
    expect(s.level).toBeLessThanOrEqual(3);
  });

  test("a transfer check stays at its fixed level", () => {
    expect(run([true, true, true, false, false], 6, true).level).toBe(6);
  });

  test("counts rounds and correct answers", () => {
    const s = run([true, false, true]);
    expect(s.rounds).toBe(3);
    expect(s.correct).toBe(2);
  });
});
