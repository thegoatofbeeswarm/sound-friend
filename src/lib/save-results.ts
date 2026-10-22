/**
 * Saving a finished result exactly once.
 *
 * Every finished tone test, speech test or training session gets one client
 * id. The database has a unique index on (user_id, client_result_id), so:
 * - a retry, a second tab or a resend after a lost response finds or hits the
 *   existing row instead of creating another;
 * - a tone test whose threshold points failed to save is completed on retry
 *   (same parent row, points rewritten) rather than duplicated.
 *
 * The storage is passed in so the logic can be tested without Supabase.
 */

export type SaveOutcome = { ok: true; id: string; created: boolean } | { ok: false; stage: "parent" | "points" };

export interface ResultTable<Row> {
  /** Id of the row already saved under this client id, or null. */
  find(clientId: string): Promise<string | null>;
  /** Insert; "conflict" when the unique key already exists. */
  insert(row: Row & { client_result_id: string }): Promise<{ id: string } | "conflict" | "error">;
}

/** Find-or-insert one row by client id. */
export async function saveRowOnce<Row>(table: ResultTable<Row>, clientId: string, row: Row): Promise<SaveOutcome> {
  const existing = await table.find(clientId);
  if (existing) return { ok: true, id: existing, created: false };
  const inserted = await table.insert({ ...row, client_result_id: clientId });
  if (inserted === "error") return { ok: false, stage: "parent" };
  if (inserted === "conflict") {
    // Another tab or an earlier, lost response got there first.
    const id = await table.find(clientId);
    return id ? { ok: true, id, created: false } : { ok: false, stage: "parent" };
  }
  return { ok: true, id: inserted.id, created: true };
}

export interface PointStore<Point> {
  count(testId: string): Promise<number | null>;
  /** Remove any partial set, then write the full set. */
  replace(testId: string, points: Point[]): Promise<boolean>;
}

/** Tone test: the parent row once, then make sure its full set of points exists. */
export async function saveToneOnce<Row, Point>(
  tests: ResultTable<Row>,
  points: PointStore<Point>,
  clientId: string,
  row: Row,
  makePoints: (testId: string) => Point[],
): Promise<SaveOutcome> {
  const parent = await saveRowOnce(tests, clientId, row);
  if (!parent.ok) return parent;
  const want = makePoints(parent.id);
  const have = await points.count(parent.id);
  if (have === want.length) return parent;
  const ok = await points.replace(parent.id, want);
  return ok ? parent : { ok: false, stage: "points" };
}
