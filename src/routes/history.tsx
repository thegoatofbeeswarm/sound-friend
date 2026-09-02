import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  Ear,
  Flame,
  Headphones,
  Loader2,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Audiogram } from "@/components/Audiogram";
import { ScreeningQuality } from "@/components/ScreeningQuality";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Ear as EarType, ThresholdResult } from "@/lib/audiometry";
import {
  changeSinceLast,
  hearingScore,
  listeningRisk,
  nextScreening,
  scoreTone,
  summarizeEar,
  trainingStreak,
} from "@/lib/hearing-summary";
import { scoreScreening } from "@/lib/test-quality";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Your Hearing | Audiomaxxer- Check on and Improve your hearing with Audiomaxxer" },
      {
        name: "description",
        content:
          "Take a quick hearing screening and know your results. Improve your hearing with custom tests.",
      },
      { property: "og:title", content: "Your Hearing | Audiomaxxer- Check on and Improve your hearing with Audiomaxxer" },
      {
        property: "og:description",
        content: "Take a quick hearing screening and know your results. Improve your hearing with custom tests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

type SavedTest = {
  id: string;
  created_at: string;
  avg_threshold_db: number | null;
  worst_threshold_db: number | null;
  safe_volume_offset_db: number | null;
  trials: number;
  environment_db: number | null;
  device_type: string | null;
  points: ThresholdResult[];
};

type DashboardSession = {
  created_at: string;
  accuracy: number;
  end_level: number;
  rounds: number;
  correct: number;
};

function toneClass(tone: "ok" | "watch" | "risk") {
  return tone === "ok"
    ? "text-signal"
    : tone === "watch"
      ? "text-caution"
      : "text-danger";
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Ear;
  tone?: "default" | "ok" | "watch" | "risk";
}) {
  return (
    <div className="border-t border-border/70 pt-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className={`h-4 w-4 ${toneClass(tone === "default" ? "ok" : tone)}`} />
        {label}
      </div>
      <p className={`mt-2 text-2xl font-semibold ${tone === "default" ? "text-foreground" : toneClass(tone)}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function HistoryPage() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["hearing-dashboard", user?.id],
    queryFn: async () => {
      const [{ data: tests, error: testsError }, { data: points, error: pointsError }, { data: sessions, error: sessionsError }] =
        await Promise.all([
          supabase
             .from("hearing_tests")
             .select("id, created_at, avg_threshold_db, worst_threshold_db, safe_volume_offset_db, trials, environment_db, device_type")
             .order("created_at", { ascending: false }),
          supabase
            .from("threshold_points")
            .select("test_id, ear, frequency_hz, threshold_db, confidence"),
          supabase
            .from("training_sessions")
            .select("created_at, accuracy, end_level, rounds, correct")
            .order("created_at", { ascending: false }),
        ]);

      if (testsError) throw testsError;
      if (pointsError) throw pointsError;
      if (sessionsError) throw sessionsError;

      const savedTests: SavedTest[] = (tests ?? []).map((test) => ({
        ...test,
        points: (points ?? [])
          .filter((point) => point.test_id === test.id)
          .map<ThresholdResult>((point) => ({
            ear: point.ear as EarType,
            frequency: point.frequency_hz,
            thresholdDb: Number(point.threshold_db),
            confidence: Number(point.confidence),
          })),
      }));

      return {
        tests: savedTests,
        sessions: (sessions ?? []) as DashboardSession[],
      };
    },
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-signal" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-signal">Your personal hearing dashboard</p>
            <h1 className="mt-2 text-4xl font-semibold">Your Hearing</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              A clear view of your screening profile, listening risk, and training momentum.
            </p>
          </div>
          {user ? (
            <Button asChild>
              <Link to="/test">Run a new screening</Link>
            </Button>
          ) : null}
        </div>

        {!user ? (
          <div className="mt-10 rounded-2xl border border-border/70 bg-card/60 p-8">
            <p className="text-muted-foreground">Sign in to see your saved screenings and personalized dashboard.</p>
            <Button asChild className="mt-5">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        ) : isLoading ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-signal" />
          </div>
        ) : !data || data.tests.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border/70 bg-card/60 p-8">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-signal" />
              <h2 className="text-xl font-semibold">Your profile starts with a screening</h2>
            </div>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Complete your first adaptive screening to see per-ear results, listening guidance, and a baseline for future change.
            </p>
            <Button asChild className="mt-5">
              <Link to="/test">Start your first screening</Link>
            </Button>
          </div>
        ) : (
          <Dashboard data={data} />
        )}
      </main>
    </div>
  );
}

function Dashboard({ data }: { data: { tests: SavedTest[]; sessions: DashboardSession[] } }) {
  const current = data.tests[0];
  const previous = data.tests[1];
  if (!current) return null;

  const score = hearingScore(current.points);
  const previousScore = previous ? hearingScore(previous.points) : null;
  const left = summarizeEar(current.points, "left");
  const right = summarizeEar(current.points, "right");
  const change = changeSinceLast(
    Number(current.avg_threshold_db),
    previous ? Number(previous.avg_threshold_db) : null,
  );
   const ceiling = 85 + Number(current.safe_volume_offset_db ?? 0);
   const risk = listeningRisk(Number(current.worst_threshold_db), ceiling);
   const screeningDue = nextScreening(current.created_at);
   const streak = trainingStreak(data.sessions.map((session) => session.created_at));
   const totalSessions = data.sessions.length;
   const trainingMinutes = data.sessions.reduce((sum, session) => sum + Math.round(session.rounds * 0.55), 0);
   const scoreDelta = score != null && previousScore != null ? score - previousScore : null;
   const quality = scoreScreening({
     environmentDb: current.environment_db,
     trials: current.trials,
     confidences: current.points.map((point) => point.confidence),
     device: current.device_type,
   });

  return (
    <>
      <section className="mt-10 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Latest screening</p>
            <p className="mt-1 text-sm text-muted-foreground">{new Date(current.created_at).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-signal/40 bg-signal/10 px-3 py-1.5 text-sm font-medium text-signal">
            <CheckCircle2 className="h-4 w-4" /> Profile updated
          </div>
         </div>
         <ScreeningQuality quality={quality} compact className="mt-6" />
         <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Hearing score"
            value={score == null ? "—" : `${score}/100`}
            detail={scoreDelta == null ? "Baseline established" : `${scoreDelta >= 0 ? "+" : ""}${scoreDelta} points since last test`}
            icon={Ear}
            tone={score == null ? "default" : scoreTone(score)}
          />
          <Metric
            label="Listening risk"
            value={risk.label}
            detail={`Personal guidance near ${ceiling} dB`}
            icon={ShieldAlert}
            tone={risk.tone}
          />
          <Metric
            label="Training streak"
            value={`${streak} ${streak === 1 ? "day" : "days"}`}
            detail={`${totalSessions} ${totalSessions === 1 ? "session" : "sessions"} completed`}
            icon={Flame}
            tone={streak > 0 ? "watch" : "default"}
          />
          <Metric
            label="Next screening"
            value={screeningDue == null ? "—" : screeningDue <= 0 ? "Due now" : `In ${screeningDue} days`}
            detail="Recommended 30-day check-in"
            icon={CalendarClock}
            tone={screeningDue != null && screeningDue <= 0 ? "watch" : "default"}
          />
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Ear-by-ear profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">Thresholds from your latest screening</p>
            </div>
            <Headphones className="h-5 w-5 text-signal" />
          </div>
          <div className="mt-6 space-y-4">
            {[left, right].map((ear) =>
              ear ? (
                <div key={ear.ear} className="rounded-xl border border-border/70 bg-background/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold capitalize">{ear.ear} ear</span>
                      <span className={`rounded-full bg-muted px-2 py-0.5 text-xs font-medium ${toneClass(ear.tone)}`}>
                        {ear.label}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">avg {ear.avgDb.toFixed(1)} dB HL</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ear.detail}</p>
                </div>
              ) : null,
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Change over time</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {change == null ? "Your next screening will create a comparison." : `${change > 0 ? "Average thresholds rose" : change < 0 ? "Average thresholds improved" : "Average thresholds are stable"} by ${Math.abs(change).toFixed(1)} dB`}
              </p>
            </div>
            {change == null ? <TrendingDown className="h-5 w-5 text-muted-foreground" /> : change > 0 ? <TrendingUp className="h-5 w-5 text-danger" /> : <TrendingDown className="h-5 w-5 text-signal" />}
          </div>
          <div className="mt-6">
            <Audiogram points={current.points} />
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Training momentum</h2>
            <p className="mt-1 text-sm text-muted-foreground">Small, consistent sessions build a useful baseline.</p>
          </div>
          <Button asChild variant="secondary">
            <Link to="/train">Continue training</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <Metric label="Completed" value={`${totalSessions}`} detail="Total training sessions" icon={CheckCircle2} tone="ok" />
          <Metric label="Training time" value={`${trainingMinutes} min`} detail="Estimated from completed rounds" icon={Headphones} />
          <Metric label="Last result" value={data.sessions[0] ? `${data.sessions[0].accuracy}%` : "—"} detail="Accuracy in your latest session" icon={Target} tone="watch" />
        </div>
      </section>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        This dashboard is a screening and self-tracking tool, not a medical diagnosis. If you notice sudden change, pain, or persistent ringing, seek a qualified hearing professional.
      </p>
    </>
  );
}
