import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Compass, Ear, Loader2, MessagesSquare, Music, Target } from "lucide-react";
import { ScoreTrend } from "@/components/charts/lazy";
import { SiteNav } from "@/components/SiteNav";
import { ScoreRing } from "@/components/ScoreRing";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import {
  bandOf,
  buildProfile,
  listeningTimeline,
  DIMENSION_ACTION,
  listeningScore,
  weakestDimension,
  type Dimension,
  type DimensionId,
} from "@/lib/listening-profile";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Listening Profile | Audiomaxxer" },
      {
        name: "description",
        content:
          "Five listening skills in one profile: sensitivity, speech in noise, sound discrimination, auditory attention and working memory — measured, trained and retested.",
      },
      { property: "og:title", content: "Listening Profile | Audiomaxxer" },
      {
        property: "og:description",
        content:
          "Five listening skills in one profile: sensitivity, speech in noise, sound discrimination, auditory attention and working memory.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const ICONS: Record<DimensionId, typeof Ear> = {
  sensitivity: Ear,
  speech: MessagesSquare,
  discrimination: Music,
  attention: Compass,
  memory: Activity,
};

function bandClass(score: number | null) {
  if (score == null) return "text-muted-foreground";
  const band = bandOf(score);
  if (band === "strong") return "text-signal";
  if (band === "typical") return "text-foreground";
  if (band === "watch") return "text-caution";
  return "text-danger";
}

function toneOf(score: number | null): "accent" | "caution" | "danger" | "muted" {
  if (score == null) return "muted";
  const band = bandOf(score);
  if (band === "watch") return "caution";
  if (band === "low") return "danger";
  return "accent";
}


function DimensionCard({ dim, average }: { dim: Dimension; average: number | null }) {
  const { t } = useI18n();
  const Icon = ICONS[dim.id];
  const action = DIMENSION_ACTION[dim.id];

  let context: string | null = null;
  if (dim.score != null && average != null) {
    const delta = Math.round(dim.score - average);
    context =
      Math.abs(delta) <= 3
        ? t("profile.vsAvg.at")
        : t(delta > 0 ? "profile.vsAvg.above" : "profile.vsAvg.below").replace(
            "{n}",
            String(Math.abs(delta)),
          );
  }

  return (
    <article className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-signal" />
          <h3 className="text-lg font-semibold">{t(`profile.dim.${dim.id}`)}</h3>
        </div>
        <div className="text-right">
          <p className={`font-display text-3xl font-semibold ${bandClass(dim.score)}`}>
            {dim.score == null ? "—" : `${dim.score}`}
            {dim.score == null ? null : <span className="text-sm text-muted-foreground"> /100</span>}
          </p>
          <p className={`text-xs font-medium ${bandClass(dim.score)}`}>
            {dim.score == null ? t("profile.noData") : t(`profile.band.${bandOf(dim.score)}`)}
          </p>
        </div>
      </div>
      <Progress value={dim.score ?? 0} className="mt-4" />
      <p className="mt-3 text-sm text-muted-foreground">{t(`profile.desc.${dim.id}`)}</p>
      {context ? <p className="mt-2 text-xs text-foreground/80">{context}</p> : null}
      <p className="mt-2 text-xs text-muted-foreground">
        {dim.score == null
          ? t("profile.noData")
          : t(`profile.evidence.${dim.evidence}`)}
        {" · "}
        {t(dim.sourceKey)}
      </p>

      <Button asChild size="sm" variant="secondary" className="mt-4">
        <Link to={action.to}>{t(action.labelKey)}</Link>
      </Button>
    </article>
  );
}

function ProfilePage() {
  const { t } = useI18n();
  const { user, loading } = useAuth();

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["listening-profile", user?.id],
    queryFn: async () => {
      const [tests, speech, sessions] = await Promise.all([
        supabase
          .from("hearing_tests")
          .select("created_at, avg_threshold_db")
          .order("created_at", { ascending: false }),
        supabase
          .from("speech_tests")
          .select("created_at, score")
          .order("created_at", { ascending: false }),
        supabase
          .from("training_sessions")
          .select("mode, accuracy, end_level, created_at")
          .order("created_at", { ascending: false }),
      ]);
      if (tests.error) throw tests.error;
      if (speech.error) throw speech.error;
      if (sessions.error) throw sessions.error;

      return {
        dims: buildProfile({
          avgThresholdDb: tests.data?.[0]?.avg_threshold_db ?? null,
          toneTests: tests.data?.length ?? 0,
          speechScore: speech.data?.[0]?.score ?? null,
          speechTests: speech.data?.length ?? 0,
          sessions: sessions.data ?? [],
        }),
        timeline: listeningTimeline({
          tone: tests.data ?? [],
          speech: speech.data ?? [],
          sessions: sessions.data ?? [],
        }),
      };
    },
  });

  const dims = data?.dims ?? [];
  const timeline = data?.timeline ?? [];
  const trendChange =
    timeline.length >= 2 ? timeline[timeline.length - 1]!.score - timeline[0]!.score : null;
  const overall = listeningScore(dims);
  const weakest = weakestDimension(dims);

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-4xl font-semibold">{t("profile.title")}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{t("profile.lead")}</p>

        {!user && !loading ? (
          <div className="mt-10 rounded-2xl border border-border/70 bg-card/70 p-6">
            <p className="text-sm text-muted-foreground">{t("profile.signedOut")}</p>
            <Button asChild className="mt-4">
              <Link to="/auth">{t("profile.signIn")}</Link>
            </Button>
          </div>
        ) : isLoading || loading ? (
          <div className="mt-12 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> …
          </div>
        ) : (
          <>
            <section className="mt-10 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
              <h2 className="text-xl font-semibold">{t("trend.title")}</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("trend.body")}</p>
              {timeline.length < 2 ? (
                <p className="mt-4 text-sm text-muted-foreground">{t("trend.empty")}</p>
              ) : (
                <>
                  <p className="mt-3 text-sm text-signal">
                    {trendChange == null || Math.abs(trendChange) < 2
                      ? t("trend.changeFlat")
                      : trendChange > 0
                        ? t("trend.changeUp").replace("{n}", String(trendChange))
                        : t("trend.changeDown").replace("{n}", String(Math.abs(trendChange)))}
                  </p>
                  <div className="mt-4 h-64 w-full">
                    <ScoreTrend timeline={timeline} scoreLabel={t("trend.score")} />
                  </div>
                </>
              )}
            </section>

            <section className="relative mt-6 overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-6 shadow-card md:p-10">
              <div
                aria-hidden
                className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
                style={{ background: "radial-gradient(circle, var(--signal), transparent 70%)" }}
              />
              <div className="relative grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center">
                <div className="flex flex-col items-center">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {t("profile.overall")}
                  </p>
                  <div className="mt-4">
                    <ScoreRing value={overall} size={220} stroke={12} tone={toneOf(overall)} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {overall == null ? t("profile.overallEmpty") : t(`profile.band.${bandOf(overall)}`)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
                  {dims.map((d) => (
                    <Link
                      key={d.id}
                      to={DIMENSION_ACTION[d.id].to}
                      className="flex flex-col items-center transition-transform hover:-translate-y-1"
                    >
                      <ScoreRing value={d.score} size={92} stroke={7} tone={toneOf(d.score)} />
                      <span className="mt-2 text-center text-xs text-muted-foreground">
                        {t(`profile.dim.${d.id}`)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="relative mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/60 p-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    <Target className="h-4 w-4 text-signal" /> {t("profile.focus")}
                  </div>
                  {weakest ? (
                    <>
                      <p className="mt-2 text-2xl font-semibold">{t(`profile.dim.${weakest.id}`)}</p>
                      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                        {t("profile.focusBody").replace("{name}", t(`profile.dim.${weakest.id}`))}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">{t("profile.overallEmpty")}</p>
                  )}
                </div>
                {weakest ? (
                  <Button asChild size="lg">
                    <Link to={DIMENSION_ACTION[weakest.id].to}>
                      {t(DIMENSION_ACTION[weakest.id].labelKey)}
                    </Link>
                  </Button>
                ) : null}
              </div>
            </section>

            <section className="mt-8 grid gap-5 md:grid-cols-2">
              {dims.map((d) => (
                <DimensionCard key={d.id} dim={d} />
              ))}
            </section>

          </>
        )}

        <section className="mt-14 rounded-2xl border border-border/70 bg-card/40 p-6">
          <h2 className="text-xl font-semibold">{t("profile.loopTitle")}</h2>
          <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>1. {t("profile.loop1")}</li>
            <li>2. {t("profile.loop2")}</li>
            <li>3. {t("profile.loop3")}</li>
          </ol>
        </section>

        <p className="mt-6 text-xs text-muted-foreground">{t("profile.disclaimer")}</p>
      </main>
    </div>
  );
}
