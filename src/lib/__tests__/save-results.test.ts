import { describe, expect, test } from "bun:test";
import { saveRowOnce, saveToneOnce, type PointStore, type ResultTable } from "../save-results";

type Row = { value: number };

/** In-memory table with the same unique key as migration 0010. */
function fakeTable(opts: { loseResponse?: number; failInsert?: number } = {}) {
  const rows: (Row & { id: string; client_result_id: string })[] = [];
  let inserts = 0;
  const table: ResultTable<Row> = {
    async find(clientId) {
      return rows.find((r) => r.client_result_id === clientId)?.id ?? null;
    },
    async insert(row) {
      inserts++;
      if (opts.failInsert === inserts) return "error";
      if (rows.some((r) => r.client_result_id === row.client_result_id)) return "conflict";
      const id = `t${rows.length + 1}`;
      rows.push({ ...row, id });
      // The row is committed, but the client never hears back.
      if (opts.loseResponse === inserts) return "error";
      return { id };
    },
  };
  return { table, rows };
}

function fakePoints(opts: { failReplace?: number } = {}) {
  const points: { testId: string; n: number }[] = [];
  let replaces = 0;
  const store: PointStore<{ testId: string; n: number }> = {
    async count(testId) {
      return points.filter((p) => p.testId === testId).length;
    },
    async replace(testId, next) {
      replaces++;
      if (opts.failReplace === replaces) return false;
      for (let i = points.length - 1; i >= 0; i--) if (points[i]!.testId === testId) points.splice(i, 1);
      points.push(...next);
      return true;
    },
  };
  return { store, points };
}

const tenPoints = (testId: string) => Array.from({ length: 10 }, (_, n) => ({ testId, n }));

describe("saving a result once", () => {
  test("two different completed results create two rows", async () => {
    const { table, rows } = fakeTable();
    await saveRowOnce(table, "a", { value: 1 });
    await saveRowOnce(table, "b", { value: 2 });
    expect(rows.length).toBe(2);
  });

  test("saving the same result twice creates one row", async () => {
    const { table, rows } = fakeTable();
    const first = await saveRowOnce(table, "a", { value: 1 });
    const second = await saveRowOnce(table, "a", { value: 1 });
    expect(rows.length).toBe(1);
    expect(second.ok && !second.created).toBe(true);
    expect(first.ok && second.ok && first.id === second.id).toBe(true);
  });

  test("two tabs saving at once create one row", async () => {
    const { table, rows } = fakeTable();
    const [x, y] = await Promise.all([saveRowOnce(table, "a", { value: 1 }), saveRowOnce(table, "a", { value: 1 })]);
    expect(rows.length).toBe(1);
    expect(x.ok && y.ok).toBe(true);
  });

  test("a commit whose response was lost is found on retry, not duplicated", async () => {
    const { table, rows } = fakeTable({ loseResponse: 1 });
    const first = await saveRowOnce(table, "a", { value: 1 });
    expect(first.ok).toBe(false);
    const retry = await saveRowOnce(table, "a", { value: 1 });
    expect(retry.ok).toBe(true);
    expect(rows.length).toBe(1);
  });
});

describe("tone test saving", () => {
  test("a failed points write stays retryable and the retry completes the same test", async () => {
    const { table, rows } = fakeTable();
    const { store, points } = fakePoints({ failReplace: 1 });
    const first = await saveToneOnce(table, store, "a", { value: 1 }, tenPoints);
    expect(first).toEqual({ ok: false, stage: "points" });
    const retry = await saveToneOnce(table, store, "a", { value: 1 }, tenPoints);
    expect(retry.ok).toBe(true);
    expect(rows.length).toBe(1);
    expect(points.length).toBe(10);
  });

  test("a complete test is left alone on a repeat save", async () => {
    const { table, rows } = fakeTable();
    const { store, points } = fakePoints();
    await saveToneOnce(table, store, "a", { value: 1 }, tenPoints);
    await saveToneOnce(table, store, "a", { value: 1 }, tenPoints);
    expect(rows.length).toBe(1);
    expect(points.length).toBe(10);
  });

  test("a parent insert failure is reported as retryable", async () => {
    const { table, rows } = fakeTable({ failInsert: 1 });
    const { store } = fakePoints();
    expect(await saveToneOnce(table, store, "a", { value: 1 }, tenPoints)).toEqual({ ok: false, stage: "parent" });
    expect((await saveToneOnce(table, store, "a", { value: 1 }, tenPoints)).ok).toBe(true);
    expect(rows.length).toBe(1);
  });
});

describe("before migration 0010 is applied", () => {
  test("missing-column errors are recognised, others are not", async () => {
    const { isMissingClientIdColumn } = await import("../save-results-supabase");
    expect(isMissingClientIdColumn({ code: "42703", message: "column hearing_tests.client_result_id does not exist" })).toBe(true);
    expect(isMissingClientIdColumn({ code: "PGRST204", message: "Could not find the 'client_result_id' column of 'speech_tests' in the schema cache" })).toBe(true);
    expect(isMissingClientIdColumn({ code: "42703", message: "column hearing_tests.other does not exist" })).toBe(false);
    expect(isMissingClientIdColumn({ code: "23505", message: "duplicate key" })).toBe(false);
    expect(isMissingClientIdColumn(null)).toBe(false);
  });
});
