import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Ear, Flame, Headphones } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lastSevenDays, loadExposure, STATUS_LABEL, statusForDose } from "@/lib/exposure";
import { dayStreak, type SessionRow } from "@/lib/gamification";
import { scoreScreening } from "@/lib/test-quality";
import { Button } from "@/components/ui/button";

export function CoachSnapshot({ userId }: { userId: string }) {
  const [exposure, setExposure] = useState(() => lastSevenDays(loadExposure()));
  const { data } = useQuery({
    queryKey: ["coach-snapshot", userId],
    queryFn: async () => {
      const [{ data: tests, error: testsError }, { data: sessions, error: sessionsError }] = await Promise.all([
        supabase
          .from("hearing_tests")
          .select("id, environment_db, trials, device_type, created_at")
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("training_sessions")
          .select("created_at, accuracy, end_level, rounds, correct, mode, xp, duration_sec")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (testsError) throw testsError;
      if (sessionsError) throw sessionsError;
      const latest = tests?.[0];
      let quality = null;
      if (latest) {
        const { data: points } = await supabase
          .from("threshold_points")
          .select("confidence")
          .eq("test_id", latest.id);
        quality = scoreScreening({
          environmentDb: latest.environment_db,
          trials: latest.trials,
          confidences: (points ?? []).map((point) => Number(point.confidence)),
          device: latest.device_type,
        });
      }
      return {
        quality,
        sessions: (sessions ?? []).map((session) => ({
          ...session,
          accuracy: Number(session.accuracy),
          end_level: Number(session.end_level),
          rounds: Number(session.rounds),
          correct: Number(session.correct),
          mode: session.mode || "soundscape",
          xp: Number(session.xp) || 0,
          duration_sec: Number(session.duration_sec) || 0,
        })) as SessionRow[],
      };
    },
  });

  useEffect(() => {
    setExposure(lastSevenDays(loadExposure()));
  }, []);

  const streak = data ? dayStreak(data.sessions) : 0;
  const status = statusForDose(exposure.avgDosePercent);
  const latestAccuracy = data?.sessions[0]?.accuracy;

  return (
    <section className="mt-8 rounded-2xl border border-signal/25 bg-signal/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-signal">Your coach snapshot</p>
          <h2 className="mt-1 text-xl font-semibold">Start with what changed</h2>
          <p className="mt-1 text-sm text-muted-foreground">A quick read of your saved data before you ask a question.</p>
        </div>
        <Activity className="h-5 w-5 text-signal" />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <SnapshotMetric icon={Ear} label="Screening quality" value={data?.quality ? `${data.quality.score}/100` : "No screening"} detail={data?.quality?.label ?? "Run your first screening"} />
        <SnapshotMetric icon={Flame} label="Training rhythm" value={`${streak} ${streak === 1 ? "day" : "days"}`} detail={latestAccuracy == null ? "No training yet" : `${latestAccuracy}% latest accuracy`} />
        <SnapshotMetric icon={Headphones} label="Listening log" value={STATUS_LABEL[status]} detail={`${exposure.totalMinutes} min logged this week`} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm"><Link to="/coach/$threadId" params={{ threadId: "new" }}>Ask about my latest results</Link></Button>
        <Button asChild size="sm" variant="secondary"><Link to="/history">Open hearing dashboard</Link></Button>
      </div>
    </section>
  );
}

function SnapshotMetric({ icon: Icon, label, value, detail }: { icon: typeof Ear; label: string; value: string; detail: string }) {
  return (
    <div className="border-t border-border/60 pt-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"><Icon className="h-4 w-4 text-signal" />{label}</div>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
