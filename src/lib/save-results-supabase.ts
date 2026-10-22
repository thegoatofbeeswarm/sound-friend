import { supabase } from "@/integrations/supabase/client";
import type { PointStore, ResultTable } from "@/lib/save-results";

type ResultTableName = "hearing_tests" | "speech_tests" | "training_sessions";

/**
 * True when the database doesn't have client_result_id yet (migration 0010
 * not applied): Postgres reports 42703 for an unknown column in a filter, and
 * PostgREST reports PGRST204 for an unknown column in an insert. Saving then
 * falls back to a plain insert so results still save, without the duplicate
 * protection, until the migration runs.
 */
export function isMissingClientIdColumn(error: { code?: string | null; message?: string | null } | null): boolean {
  if (!error) return false;
  return (error.code === "42703" || error.code === "PGRST204") && /client_result_id/.test(error.message ?? "");
}

/** Supabase-backed result table, keyed by (user_id, client_result_id). */
export function resultTable<Row extends Record<string, unknown>>(name: ResultTableName, userId: string): ResultTable<Row> {
  // The three tables share the columns used here; the union confuses the
  // generated types, so the client is narrowed to one call shape.
  const from = () => supabase.from(name as "hearing_tests");
  return {
    async find(clientId) {
      const { data, error } = await from()
        .select("id")
        .eq("user_id", userId)
        .eq("client_result_id", clientId)
        .maybeSingle();
      if (isMissingClientIdColumn(error)) return null;
      return data?.id ?? null;
    },
    async insert(row) {
      let { data, error } = await from()
        .insert(row as never)
        .select("id")
        .single();
      if (isMissingClientIdColumn(error)) {
        const { client_result_id: _unused, ...plain } = row;
        ({ data, error } = await from()
          .insert(plain as never)
          .select("id")
          .single());
      }
      if (error) return error.code === "23505" ? "conflict" : "error";
      return data ? { id: data.id } : "error";
    },
  };
}

export type ThresholdPointRow = {
  test_id: string;
  user_id: string;
  ear: "left" | "right";
  frequency_hz: number;
  threshold_db: number;
  confidence: number;
};

export function thresholdPoints(): PointStore<ThresholdPointRow> {
  return {
    async count(testId) {
      const { count, error } = await supabase
        .from("threshold_points")
        .select("id", { count: "exact", head: true })
        .eq("test_id", testId);
      return error ? null : count;
    },
    async replace(testId, points) {
      const del = await supabase.from("threshold_points").delete().eq("test_id", testId);
      if (del.error) return false;
      const { error } = await supabase.from("threshold_points").insert(points);
      return !error;
    },
  };
}
