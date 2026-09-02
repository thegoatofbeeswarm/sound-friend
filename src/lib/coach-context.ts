import { supabase } from "@/integrations/supabase/client";
import { getDevice, loadDevice } from "@/lib/devices";
import { loadExposure, lastSevenDays, weeklyTrendPercent, STATUS_LABEL, statusForDose } from "@/lib/exposure";
import { dayStreak, totalXp } from "@/lib/gamification";
import { TRAINING_MODES } from "@/lib/training-modes";
import { scoreScreening } from "@/lib/test-quality";

/**
 * Builds a compact plain-text snapshot of the signed-in user's hearing data
 * that the coach model reads before answering.
 */
export async function buildCoachContext(): Promise<string> {
  const device = getDevice(loadDevice());
  const lines: string[] = [
    `Listening device: ${device.label} (${device.hint}, peaks ~${device.maxOutputDb} dB, ${device.isolation} isolation).`,
  ];

  const { data: tests } = await supabase
    .from("hearing_tests")
    .select("id, created_at, avg_threshold_db, worst_threshold_db, safe_volume_offset_db, trials, environment_db, device_type")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!tests || tests.length === 0) {
    lines.push("Screenings: none saved yet.");
  } else {
    lines.push(`Screenings saved: ${tests.length} (most recent first)`);
    for (const t of tests) {
      const deviceForTest = getDevice(t.device_type);
      lines.push(
        `- ${new Date(t.created_at).toLocaleDateString()}: avg ${Number(t.avg_threshold_db ?? 0).toFixed(1)} dB HL, worst ${Number(t.worst_threshold_db ?? 0).toFixed(1)} dB HL, ${t.trials} trials, quality inputs: ${deviceForTest.calibrated ? "model profile" : "uncalibrated device"}${
          t.environment_db == null ? ", room noise not measured" : `, room noise ~${Number(t.environment_db)} dB`
        }${t.device_type ? `, device ${deviceForTest.label}` : ""}`,
      );
    }

    const latest = tests[0];
    if (latest) {
      const { data: points } = await supabase
        .from("threshold_points")
        .select("ear, frequency_hz, threshold_db, confidence")
        .eq("test_id", latest.id);
      if (points?.length) {
        const fmt = points
          .slice()
          .sort((a, b) => a.frequency_hz - b.frequency_hz)
          .map((p) => `${p.ear} ${p.frequency_hz}Hz ${Number(p.threshold_db).toFixed(0)}dB`)
          .join(", ");
        const quality = scoreScreening({
          environmentDb: latest.environment_db,
          trials: latest.trials,
          confidences: points.map((point) => Number(point.confidence)),
          device: latest.device_type,
        });
        lines.push(`Latest audiogram thresholds: ${fmt}.`);
        lines.push(`Latest screening quality: ${quality.score}/100, ${quality.label}. ${quality.interpretation}`);
      }
    }
  }

  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("created_at, accuracy, end_level, quietest_db, rounds, correct, mode, xp, duration_sec")
    .order("created_at", { ascending: false })
    .limit(20);

  if (!sessions || sessions.length === 0) {
    lines.push("Training sessions: none yet.");
  } else {
    const rows = sessions.map((s) => ({
      ...s,
      accuracy: Number(s.accuracy),
      end_level: Number(s.end_level),
      rounds: Number(s.rounds),
      correct: Number(s.correct),
      mode: s.mode || "soundscape",
      xp: Number(s.xp) || 0,
      duration_sec: Number(s.duration_sec) || 0,
    }));
    const focus = TRAINING_MODES.find((mode) => mode.id === (rows[0]?.mode ?? "soundscape"));
    lines.push(`Training summary: ${rows.length} recent sessions, ${totalXp(rows)} XP, ${dayStreak(rows)} day streak.`);
    lines.push(`Most recent training focus: ${focus?.label ?? "Everyday sounds"}.`);
    for (const s of rows.slice(0, 8)) {
      lines.push(
        `- ${new Date(s.created_at).toLocaleDateString()}: ${s.accuracy}% accuracy (${s.correct}/${s.rounds}), ${s.mode}, difficulty ${s.end_level.toFixed(1)}/10${s.duration_sec ? `, ${Math.round(s.duration_sec / 60)} min` : ""}${s.quietest_db == null ? "" : `, quietest identified ${Number(s.quietest_db)} dB`}`,
      );
    }
  }

  if (typeof window !== "undefined") {
    const exposure = loadExposure();
    const week = lastSevenDays(exposure);
    const trend = weeklyTrendPercent(exposure);
    const status = statusForDose(week.avgDosePercent);
    lines.push(`Logged listening behaviour: ${week.totalMinutes} minutes in the last 7 days, average estimate ${week.avgDb ?? "not logged"} dB, peak ${week.peakDb ?? "not logged"} dB, exposure status ${STATUS_LABEL[status]}${trend == null ? "" : `, ${trend >= 0 ? "+" : ""}${trend}% vs prior week`}.`);
  } else {
    lines.push("Logged listening behaviour: unavailable during server rendering.");
  }

  return lines.join("\n");
}
