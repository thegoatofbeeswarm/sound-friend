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
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
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
            <p className="text-sm font-medium text-signal">{t("history.tagline")}</p>
            <h1 className="mt-2 text-4xl font-semibold">{t("history.title")}</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              {t("history.lead")}
            </p>
          </div>
          {user ? (
            <Button asChild>
              <Link to="/test">{t("history.runScreening")}</Link>
            </Button>
          ) : null}
        </div>

        {!user ? (
          <div className="mt-10 rounded-2xl border border-border/70 bg-card/60 p-8">
            <p className="text-muted-foreground">{t("history.signInPrompt")}</p>
            <Button asChild className="mt-5">
              <Link to="/auth">{t("history.signIn")}</Link>
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
              <h2 className="text-xl font-semibold">{t("history.profileStartTitle")}</h2>
            </div>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {t("history.profileStartBody")}
            </p>
            <Button asChild className="mt-5">
              <Link to="/test">{t("history.startFirst")}</Link>
            </Button>
          </div>
        ) : (
          <Dashboard data={data} t={t} />
        )}
      </main>
    </div>
  );
}

function Dashboard({ data, t }: { data: { tests: SavedTest[]; sessions: DashboardSession[] }; t: (key: string) => string }) {
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
   const riskLabelKey: Record<string, string> = {
     Unknown: "history.risk.unknown",
     High: "history.risk.high",
     Moderate: "history.risk.moderate",
     Low: "history.risk.low",
   };
   const earLabelKey: Record<string, string> = {
     Normal: "history.ear.normal",
     "Moderate reduction": "history.ear.moderateReduction",
     "Mild reduction": "history.ear.mildReduction",
     "Slight reduction at 4–8 kHz": "history.ear.slightHighFreq",
     "Slight reduction": "history.ear.slightReduction",
   };
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
            <p className="text-sm font-medium text-muted-foreground">{t("history.latestScreening")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{new Date(current.created_at).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-signal/40 bg-signal/10 px-3 py-1.5 text-sm font-medium text-signal">
            <CheckCircle2 className="h-4 w-4" /> {t("history.profileUpdated")}
          </div>
         </div>
         <ScreeningQuality quality={quality} compact className="mt-6" />
         <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label={t("history.hearingScore")}
            value={score == null ? "—" : `${score}/100`}
            detail={scoreDelta == null ? t("history.baselineEstablished") : t("history.pointsSinceLast").replace("{sign}", scoreDelta >= 0 ? "+" : "").replace("{n}", String(scoreDelta))}
            icon={Ear}
            tone={score == null ? "default" : scoreTone(score)}
          />
          <Metric
            label={t("history.listeningRisk")}
            value={t(riskLabelKey[risk.label] ?? "history.risk.unknown")}
            detail={t("history.personalGuidance").replace("{n}", String(ceiling))}
            icon={ShieldAlert}
            tone={risk.tone}
          />
          <Metric
            label={t("history.trainingStreak")}
            value={`${streak} ${streak === 1 ? t("history.day") : t("history.days")}`}
            detail={`${totalSessions} ${totalSessions === 1 ? t("history.session") : t("history.sessions")} ${t("history.completedSuffix")}`}
            icon={Flame}
            tone={streak > 0 ? "watch" : "default"}
          />
          <Metric
            label={t("history.nextScreening")}
            value={screeningDue == null ? "—" : screeningDue <= 0 ? t("history.dueNow") : t("history.inDays").replace("{n}", String(screeningDue))}
            detail={t("history.recommendedCheckin")}
            icon={CalendarClock}
            tone={screeningDue != null && screeningDue <= 0 ? "watch" : "default"}
          />
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{t("history.earProfileTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("history.earProfileSub")}</p>
            </div>
            <Headphones className="h-5 w-5 text-signal" />
          </div>
          <div className="mt-6 space-y-4">
            {[left, right].map((ear) =>
              ear ? (
                <div key={ear.ear} className="rounded-xl border border-border/70 bg-background/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold capitalize">{t(ear.ear === "left" ? "history.earLeft" : "history.earRight")} {t("history.earSuffix")}</span>
                      <span className={`rounded-full bg-muted px-2 py-0.5 text-xs font-medium ${toneClass(ear.tone)}`}>
                        {t(earLabelKey[ear.label] ?? "history.ear.normal")}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">{t("history.avgDbHl").replace("{n}", ear.avgDb.toFixed(1))}</span>
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
              <h2 className="text-xl font-semibold">{t("history.changeOverTime")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {change == null ? t("history.nextComparison") : `${change > 0 ? t("history.thresholdsRose") : change < 0 ? t("history.thresholdsImproved") : t("history.thresholdsStable")} ${t("history.byDb").replace("{n}", Math.abs(change).toFixed(1))}`}
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
            <h2 className="text-xl font-semibold">{t("history.trainingMomentum")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("history.trainingMomentumSub")}</p>
          </div>
          <Button asChild variant="secondary">
            <Link to="/train">{t("history.continueTraining")}</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <Metric label={t("history.completed")} value={`${totalSessions}`} detail={t("history.totalSessions")} icon={CheckCircle2} tone="ok" />
          <Metric label={t("history.trainingTime")} value={`${trainingMinutes} min`} detail={t("history.estimatedFromRounds")} icon={Headphones} />
          <Metric label={t("history.lastResult")} value={data.sessions[0] ? `${data.sessions[0].accuracy}%` : "—"} detail={t("history.accuracyLatest")} icon={Target} tone="watch" />
        </div>
      </section>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        {t("history.disclaimer")}
      </p>
    </>
  );
}
