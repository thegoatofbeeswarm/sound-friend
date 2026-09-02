import { supabase } from "@/integrations/supabase/client";
import { getDevice, loadDevice } from "@/lib/devices";

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
      lines.push(
        `- ${new Date(t.created_at).toLocaleDateString()}: avg ${Number(t.avg_threshold_db ?? 0).toFixed(1)} dB HL, worst ${Number(t.worst_threshold_db ?? 0).toFixed(1)} dB HL, personal ceiling ${85 + Number(t.safe_volume_offset_db ?? 0)} dB, ${t.trials} trials${
          t.environment_db ? `, room noise ~${Number(t.environment_db)} dB` : ""
        }${t.device_type ? `, device ${t.device_type}` : ""}`,
      );
    }

    const latest = tests[0]!;
    const { data: points } = await supabase
      .from("threshold_points")
      .select("ear, frequency_hz, threshold_db")
      .eq("test_id", latest.id);
    if (points?.length) {
      const fmt = points
        .slice()
        .sort((a, b) => a.frequency_hz - b.frequency_hz)
        .map((p) => `${p.ear} ${p.frequency_hz}Hz ${Number(p.threshold_db).toFixed(0)}dB`)
        .join(", ");
      lines.push(`Latest audiogram thresholds: ${fmt}.`);
    }
  }

  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("created_at, accuracy, end_level, quietest_db, rounds, correct")
    .order("created_at", { ascending: false })
    .limit(8);

  if (!sessions || sessions.length === 0) {
    lines.push("Training sessions: none yet.");
  } else {
    lines.push(`Training sessions (most recent first, ${sessions.length} shown):`);
    for (const s of sessions) {
      lines.push(
        `- ${new Date(s.created_at).toLocaleDateString()}: ${s.accuracy}% accuracy (${s.correct}/${s.rounds}), difficulty ${Number(s.end_level).toFixed(1)}/10${
          s.quietest_db == null ? "" : `, quietest identified ${Number(s.quietest_db)} dB`
        }`,
      );
    }
  }

  return lines.join("\n");
}
