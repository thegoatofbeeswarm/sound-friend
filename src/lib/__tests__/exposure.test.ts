import { beforeEach, describe, expect, test } from "bun:test";

const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
};

const { logListening, entryDosePercent, equivalentLevelDb, dosePercent, lastSevenDays, loadExposure, dayId } =
  await import("../exposure");

beforeEach(() => store.clear());

describe("exposure aggregation", () => {
  test("an hour at 70 dB plus an hour at 100 dB is not 85 dB / 25%", () => {
    logListening(60, 70);
    const [today] = logListening(60, 100);
    expect(today!.minutes).toBe(120);
    // Energy-equivalent level for equal durations of 70 and 100 dB is ~96.99 dB.
    expect(equivalentLevelDb(today!.segments!)).toBeCloseTo(96.994, 2);
    expect(today!.avgDb).toBe(97);
    // Each stretch's dose summed under the same reference: ~0.4% + 400%.
    const expected = dosePercent(70, 1) + dosePercent(100, 1);
    expect(Math.abs(entryDosePercent(today!) - expected)).toBeLessThanOrEqual(1);
    expect(entryDosePercent(today!)).toBeGreaterThan(390);
    expect(today!.peakDb).toBe(100);
  });

  test("components are not rounded before summing", () => {
    logListening(10, 80);
    const [today] = logListening(10, 80);
    expect(entryDosePercent(today!)).toBe(dosePercent(80, 20 / 60));
  });

  test("the weekly window reports an energy-equivalent level", () => {
    logListening(60, 70);
    const entries = logListening(60, 100);
    expect(lastSevenDays(entries).avgDb).toBe(97);
    expect(lastSevenDays(entries).includesLegacy).toBe(false);
  });

  test("days saved before segments existed are flagged as legacy", () => {
    store.set(
      "audiomaxxer.exposure.v1",
      JSON.stringify([{ day: dayId(), minutes: 120, avgDb: 85, peakDb: 100 }]),
    );
    const [legacy] = loadExposure();
    expect(legacy!.legacyMerged).toBe(true);
    expect(lastSevenDays(loadExposure()).includesLegacy).toBe(true);
  });
});
