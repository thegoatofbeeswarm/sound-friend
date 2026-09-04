import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Flame, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/SiteNav";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { TRAINING_MODES, modeById } from "@/lib/training-modes";
import {
  dayStreak,
  focusMode,
  startOfWeek,
  totalXp,
  WEEKLY_GOAL_SESSIONS,
  type SessionRow,
} from "@/lib/gamification";
import {
  formatMinutes,
  lastSevenDays,
  loadExposure,
  statusForDose,
  weeklyTrendPercent,
  type ExposureEntry,
} from "@/lib/exposure";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Your Weekly Hearing Report | Audiomaxxer" },
      {
        name: "description",
        content:
          "A weekly summary of your training time, accuracy per skill, listening exposure and screening changes, with one focus for next week.",
      },
      { property: "og:title", content: "Your Weekly Hearing Report | Audiomaxxer" },
      {
        property: "og:description",
        content:
          "Training time, accuracy per skill, listening exposure and screening changes, summed up every week.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

interface TestRow {
  created_at: string;
  avg_threshold_db: number | null;
  worst_threshold_db: number | null;
}

function weekBounds() {
  const start = startOfWeek();
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - 7);
  return { start, prevStart };
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, n) => a + n, 0) / nums.length);
}

function ReportPage() {
  const { user, loading } = useAuth();
  const { t, language } = useI18n();
  const locale = language === "zh" ? "zh-CN" : language === "es" ? "es-ES" : "en-US";
  const f = (key: string, vals: Record<string, string | number> = {}) => {
    let out = t(key);
    for (const [k, v] of Object.entries(vals)) out = out.replace(`{${k}}`, String(v));
    return out;
  };
  const [exposure, setExposure] = useState<ExposureEntry[]>([]);
  useEffect(() => setExposure(loadExposure()), []);

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["weekly-report", user?.id],
    queryFn: async () => {
      const [sessions, tests] = await Promise.all([
        supabase
          .from("training_sessions")
          .select("created_at, accuracy, end_level, rounds, correct, mode, xp, duration_sec")
          .order("created_at", { ascending: false })
          .limit(400),
        supabase
          .from("hearing_tests")
          .select("created_at, avg_threshold_db, worst_threshold_db")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      return {
        sessions: (sessions.data ?? []) as SessionRow[],
        tests: (tests.data ?? []) as TestRow[],
      };
    },
  });

  const report = useMemo(() => {
    const sessions = data?.sessions ?? [];
    const tests = data?.tests ?? [];
    const { start, prevStart } = weekBounds();
    const at = (r: { created_at: string }) => new Date(r.created_at).getTime();
    const week = sessions.filter((r) => at(r) >= start.getTime());
    const prev = sessions.filter((r) => at(r) >= prevStart.getTime() && at(r) < start.getTime());

    const perMode = TRAINING_MODES.map((m) => {
      const now = week.filter((r) => (r.mode || "soundscape") === m.id);
      const before = prev.filter((r) => (r.mode || "soundscape") === m.id);
      return {
        id: m.id,
        label: m.label,
        sessions: now.length,
        now: avg(now.map((r) => Number(r.accuracy) || 0)),
        before: avg(before.map((r) => Number(r.accuracy) || 0)),
      };
    }).filter((m) => m.sessions > 0 || m.before != null);

    const minutes = Math.round(week.reduce((a, r) => a + (Number(r.duration_sec) || 0), 0) / 60);
    const testsThisWeek = tests.filter((t) => at(t) >= start.getTime());
    const lastTwo = tests.slice(0, 2);
    const screeningChange =
      lastTwo.length === 2 &&
      lastTwo[0]?.avg_threshold_db != null &&
      lastTwo[1]?.avg_threshold_db != null
        ? Math.round((Number(lastTwo[0].avg_threshold_db) - Number(lastTwo[1].avg_threshold_db)) * 10) / 10
        : null;

    return {
      sessions: week.length,
      prevSessions: prev.length,
      minutes,
      xp: totalXp(week),
      streak: dayStreak(sessions),
      perMode,
      testsThisWeek: testsThisWeek.length,
      screeningChange,
      focus: focusMode(sessions, TRAINING_MODES.map((m) => m.id)),
    };
  }, [data]);

  const week = lastSevenDays(exposure);
  const trend = weeklyTrendPercent(exposure);
  const status = statusForDose(week.avgDosePercent);
  const focusMeta = modeById(report.focus);

  if (loading || (user && isLoading)) {
    return (
      <div className="min-h-screen">
        <SiteNav />
        <div className="mt-24 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-signal" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <SiteNav />
        <main className="mx-auto max-w-2xl px-5 py-20 text-center">
          <h1 className="text-3xl font-semibold">{t("report.signedOutTitle")}</h1>
          <p className="mt-3 text-muted-foreground">{t("report.signedOutBody")}</p>
          <Button asChild className="mt-6">
            <Link to="/auth">{t("report.createAccount")}</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-signal" />
          {f("report.weekOf", {
            date: startOfWeek().toLocaleDateString(locale, { month: "long", day: "numeric" }),
          })}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{t("report.thisWeek")}</h1>

        <section className="mt-8 grid gap-4 sm:grid-cols-4">
          <Stat label={t("report.trainingTime")} value={formatMinutes(report.minutes)} />
          <Stat
            label={t("report.sessions")}
            value={`${report.sessions}`}
            sub={f("report.goalLastWeek", {
              goal: WEEKLY_GOAL_SESSIONS,
              n: report.prevSessions,
            })}
            highlight={report.sessions >= WEEKLY_GOAL_SESSIONS}
          />
          <Stat label={t("report.xpEarned")} value={`${report.xp}`} />
          <Stat label={t("report.streak")} value={`${report.streak} ${t("report.daysShort")}`} />
        </section>

        <section className="mt-10 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <h2 className="text-xl font-semibold">{t("report.accuracyBySkill")}</h2>
          {report.perMode.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("report.noTraining")}</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {report.perMode.map((m) => {
                const delta = m.now != null && m.before != null ? m.now - m.before : null;
                return (
                  <li key={m.id} className="flex items-center justify-between gap-4 text-sm">
                    <span className="min-w-0 truncate">{t(`report.mode.${m.id}.label`)}</span>
                    <span className="shrink-0 font-medium">
                      {m.before != null ? `${m.before}% → ` : ""}
                      {m.now != null ? `${m.now}%` : t("report.notTrained")}
                      {delta != null ? (
                        <span
                          className={
                            delta > 0 ? "ml-2 text-signal" : delta < 0 ? "ml-2 text-caution" : "ml-2 text-muted-foreground"
                          }
                        >
                          {delta > 0 ? "+" : ""}
                          {delta}
                        </span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat
            label={t("report.loggedListening")}
            value={formatMinutes(week.totalMinutes)}
            sub={
              week.avgDb == null
                ? t("report.nothingLoggedYet")
                : f("report.avgAbbrev", { n: week.avgDb })
            }
          />
          <Stat
            label={t("report.exposureStatus")}
            value={t(`report.status.${status}`)}
            sub={f("report.avgDailyDose", { n: week.avgDosePercent })}
          />
          <Stat
            label={t("report.sevenDayTrend")}
            value={trend == null ? "-" : `${trend > 0 ? "↑" : trend < 0 ? "↓" : ""}${Math.abs(trend)}%`}
            sub={t("report.vsWeekBefore")}
          />
        </section>

        <section className="mt-6 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <h2 className="text-xl font-semibold">{t("report.screening")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {report.testsThisWeek > 0
              ? f("report.screeningsThisWeek", {
                  n: report.testsThisWeek,
                  plural: report.testsThisWeek > 1 && language === "en" ? "s" : "",
                })
              : t("report.noScreeningThisWeek")}
            {report.screeningChange == null
              ? t("report.needTwoScreenings")
              : f(
                  Math.abs(report.screeningChange) < 3
                    ? "report.withinVariation"
                    : "report.movedSince",
                  {
                    sign: report.screeningChange > 0 ? "+" : "",
                    n: report.screeningChange,
                  },
                )}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-signal/40 bg-signal/5 p-6 shadow-glow">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Target className="h-4 w-4 text-signal" /> {t("report.focusNextWeek")}
          </h2>
          <p className="mt-2 font-display text-2xl font-semibold">{t(`report.mode.${focusMeta.id}.label`)}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t(`report.mode.${focusMeta.id}.blurb`)}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/train">
                {t("report.startTrack")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/risks">{t("report.reviewHabits")}</Link>
            </Button>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-caution" />
            {report.sessions >= WEEKLY_GOAL_SESSIONS
              ? t("report.goalMet")
              : f("report.moreSessions", {
                  n: WEEKLY_GOAL_SESSIONS - report.sessions,
                  plural:
                    WEEKLY_GOAL_SESSIONS - report.sessions === 1 || language !== "en" ? "" : "s",
                })}
          </p>
        </section>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? "border-signal/40 bg-card shadow-glow" : "border-border/70 bg-card/60"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
