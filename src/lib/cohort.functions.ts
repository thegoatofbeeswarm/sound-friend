import { createServerFn } from "@tanstack/react-start";

/**
 * Anonymous, aggregate validation statistics across every Audiomaxxer user.
 * No identifiers ever leave the server: only counts and pooled repeatability
 * numbers. This is the public evidence base for the /validation page.
 */

export interface DeviceStat {
  device: string;
  screenings: number;
  /** Mean absolute test-retest difference on the same device, in dB-equivalent. */
  retestSpreadDb: number | null;
  retestPairs: number;
}

export interface CohortStats {
  participants: number;
  screenings: number;
  repeatScreenings: number;
  /** Pooled same-device test-retest mean absolute difference. */
  retestSpreadDb: number | null;
  retestPairs: number;
  /** Share of matched retest points within 10 dB. */
  retestWithin10Pct: number | null;
  speechTests: number;
  speechParticipants: number;
  /** Mean absolute change in speech reception threshold between two sittings. */
  speechRepeatDb: number | null;
  speechRepeatPairs: number;
  clinicReports: number;
  clinicParticipants: number;
  byDevice: DeviceStat[];
  byBand: { band: "low" | "mid" | "high"; retestSpreadDb: number | null; pairs: number }[];
  updatedAt: string;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, n) => s + n, 0) / xs.length : null);
const round1 = (n: number | null) => (n == null ? null : Math.round(n * 10) / 10);

export const getCohortStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<CohortStats> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [testsRes, pointsRes, speechRes, reportsRes] = await Promise.all([
      supabaseAdmin
        .from("hearing_tests")
        .select("id, user_id, device_type, created_at")
        .order("created_at", { ascending: true })
        .limit(5000),
      supabaseAdmin
        .from("threshold_points")
        .select("test_id, ear, frequency_hz, threshold_db")
        .limit(50000),
      supabaseAdmin
        .from("speech_tests")
        .select("user_id, srt_db, created_at")
        .order("created_at", { ascending: true })
        .limit(5000),
      supabaseAdmin.from("clinical_reports").select("user_id, status").eq("status", "ready").limit(5000),
    ]);

    const tests = testsRes.data ?? [];
    const points = pointsRes.data ?? [];
    const speech = speechRes.data ?? [];
    const reports = reportsRes.data ?? [];

    const pointsByTest = new Map<string, { ear: string; frequency_hz: number; threshold_db: number }[]>();
    for (const p of points) {
      const list = pointsByTest.get(p.test_id) ?? [];
      list.push({ ear: p.ear, frequency_hz: p.frequency_hz, threshold_db: Number(p.threshold_db) });
      pointsByTest.set(p.test_id, list);
    }

    const byUser = new Map<string, typeof tests>();
    for (const t of tests) {
      const list = byUser.get(t.user_id) ?? [];
      list.push(t);
      byUser.set(t.user_id, list);
    }

    const allDiffs: number[] = [];
    const deviceDiffs = new Map<string, number[]>();
    const deviceCounts = new Map<string, number>();
    const bandDiffs: Record<"low" | "mid" | "high", number[]> = { low: [], mid: [], high: [] };
    let repeatScreenings = 0;

    for (const t of tests) {
      const d = t.device_type || "unknown";
      deviceCounts.set(d, (deviceCounts.get(d) ?? 0) + 1);
    }

    for (const userTests of byUser.values()) {
      if (userTests.length < 2) continue;
      repeatScreenings += userTests.length - 1;
      for (let i = 1; i < userTests.length; i += 1) {
        const a = userTests[i - 1]!;
        const b = userTests[i]!;
        // Only compare sittings on the same reported device: different
        // hardware changes the scale, so mixing them is not repeatability.
        if ((a.device_type || "unknown") !== (b.device_type || "unknown")) continue;
        const pa = pointsByTest.get(a.id) ?? [];
        const pb = pointsByTest.get(b.id) ?? [];
        if (!pa.length || !pb.length) continue;
        const map = new Map(pb.map((p) => [`${p.ear}:${p.frequency_hz}`, p.threshold_db]));
        for (const p of pa) {
          const other = map.get(`${p.ear}:${p.frequency_hz}`);
          if (other == null) continue;
          const diff = Math.abs(other - p.threshold_db);
          allDiffs.push(diff);
          const dev = a.device_type || "unknown";
          deviceDiffs.set(dev, [...(deviceDiffs.get(dev) ?? []), diff]);
          const band = p.frequency_hz < 1000 ? "low" : p.frequency_hz < 4000 ? "mid" : "high";
          bandDiffs[band].push(diff);
        }
      }
    }

    const speechByUser = new Map<string, number[]>();
    for (const s of speech) {
      speechByUser.set(s.user_id, [...(speechByUser.get(s.user_id) ?? []), Number(s.srt_db)]);
    }
    const speechDiffs: number[] = [];
    for (const list of speechByUser.values()) {
      for (let i = 1; i < list.length; i += 1) {
        speechDiffs.push(Math.abs((list[i] as number) - (list[i - 1] as number)));
      }
    }

    const byDevice: DeviceStat[] = [...deviceCounts.entries()]
      .map(([device, screenings]) => {
        const diffs = deviceDiffs.get(device) ?? [];
        return {
          device,
          screenings,
          retestSpreadDb: round1(mean(diffs)),
          retestPairs: diffs.length,
        };
      })
      .sort((a, b) => b.screenings - a.screenings)
      .slice(0, 6);

    return {
      participants: byUser.size,
      screenings: tests.length,
      repeatScreenings,
      retestSpreadDb: round1(mean(allDiffs)),
      retestPairs: allDiffs.length,
      retestWithin10Pct: allDiffs.length
        ? Math.round((allDiffs.filter((d) => d <= 10).length / allDiffs.length) * 100)
        : null,
      speechTests: speech.length,
      speechParticipants: speechByUser.size,
      speechRepeatDb: round1(mean(speechDiffs)),
      speechRepeatPairs: speechDiffs.length,
      clinicReports: reports.length,
      clinicParticipants: new Set(reports.map((r) => r.user_id)).size,
      byDevice,
      byBand: (["low", "mid", "high"] as const).map((band) => ({
        band,
        retestSpreadDb: round1(mean(bandDiffs[band])),
        pairs: bandDiffs[band].length,
      })),
      updatedAt: new Date().toISOString(),
    };
  },
);
