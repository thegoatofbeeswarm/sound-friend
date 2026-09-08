import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, Compass, Ear, MessagesSquare, Music } from "lucide-react";
import { Audiogram, ScoreTrend } from "@/components/charts/lazy";
import { ScoreRing } from "@/components/ScoreRing";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ThresholdResult } from "@/lib/audiometry";
import { useI18n } from "@/lib/i18n";
import {
  bandOf,
  listeningScore,
  weakestDimension,
  type Dimension,
  type DimensionId,
  type TimelinePoint,
} from "@/lib/listening-profile";

export const Route = createFileRoute("/sample-profile")({
  head: () => ({
    meta: [
      { title: "Sample Listening Profile | Audiomaxxer" },
      {
        name: "description",
        content:
          "See an example Audiomaxxer listening profile: an audiogram, an overall listening score and five skill scores from a fictional screening.",
      },
      { property: "og:title", content: "Sample Listening Profile | Audiomaxxer" },
      {
        property: "og:description",
        content:
          "An example listening profile with audiogram, overall score and five listening skills.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SampleProfilePage,
});

const ICONS: Record<DimensionId, typeof Ear> = {
  sensitivity: Ear,
  speech: MessagesSquare,
  discrimination: Music,
  attention: Compass,
  memory: Activity,
};

const SAMPLE_POINTS: ThresholdResult[] = [
  { ear: "left", frequency: 500, thresholdDb: 5, confidence: 0.9 },
  { ear: "left", frequency: 1000, thresholdDb: 5, confidence: 0.9 },
  { ear: "left", frequency: 2000, thresholdDb: 10, confidence: 0.88 },
  { ear: "left", frequency: 4000, thresholdDb: 18, confidence: 0.85 },
  { ear: "left", frequency: 8000, thresholdDb: 24, confidence: 0.82 },
  { ear: "right", frequency: 500, thresholdDb: 5, confidence: 0.9 },
  { ear: "right", frequency: 1000, thresholdDb: 8, confidence: 0.9 },
  { ear: "right", frequency: 2000, thresholdDb: 12, confidence: 0.87 },
  { ear: "right", frequency: 4000, thresholdDb: 22, confidence: 0.84 },
  { ear: "right", frequency: 8000, thresholdDb: 30, confidence: 0.8 },
];

const SAMPLE_DIMENSIONS: Dimension[] = [
  { id: "sensitivity", score: 78, evidence: "solid", sourceKey: "profile.source.tone", samples: 3 },
  { id: "speech", score: 64, evidence: "solid", sourceKey: "profile.source.speech", samples: 4 },
  {
    id: "discrimination",
    score: 71,
    evidence: "thin",
    sourceKey: "profile.source.discrimination",
    samples: 2,
  },
  { id: "attention", score: 58, evidence: "thin", sourceKey: "profile.source.attention", samples: 2 },
  { id: "memory", score: 49, evidence: "solid", sourceKey: "profile.source.memory", samples: 5 },
];

const SAMPLE_TIMELINE: TimelinePoint[] = [
  { date: "2026-05-10", score: 55 },
  { date: "2026-05-24", score: 58 },
  { date: "2026-06-07", score: 57 },
  { date: "2026-06-21", score: 61 },
  { date: "2026-07-05", score: 63 },
  { date: "2026-07-19", score: 64 },
];

function toneOf(score: number | null): "accent" | "caution" | "danger" | "muted" {
  if (score == null) return "muted";
  const band = bandOf(score);
  if (band === "watch") return "caution";
  if (band === "low") return "danger";
  return "accent";
}

function SampleProfilePage() {
  const { t } = useI18n();
  const overall = listeningScore(SAMPLE_DIMENSIONS);
  const weakest = weakestDimension(SAMPLE_DIMENSIONS);
  const average = overall;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
          {t("example.badge")}
        </span>
        <h1 className="mt-4 font-display text-4xl font-semibold">{t("profile.title")}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("profile.lead")}</p>

        <section className="mt-10 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex justify-center">
            <ScoreRing
              value={overall}
              size={220}
              label={t("profile.overall")}
              tone={toneOf(overall)}
            />
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
            <h2 className="text-lg font-semibold">{t("profile.focus")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("profile.focusBody").replace(
                "{name}",
                weakest ? t(`profile.dim.${weakest.id}`) : "",
              )}
            </p>
            <div className="mt-4 h-48">
              <ScoreTrend timeline={SAMPLE_TIMELINE} scoreLabel={t("profile.overall")} />
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <h2 className="text-lg font-semibold">{t("example.title")}</h2>
          <div className="mt-4">
            <Audiogram points={SAMPLE_POINTS} />
          </div>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_DIMENSIONS.map((dim) => {
            const Icon = ICONS[dim.id];
            const delta =
              dim.score != null && average != null ? Math.round(dim.score - average) : null;
            const context =
              delta == null
                ? null
                : Math.abs(delta) <= 3
                  ? t("profile.vsAvg.at")
                  : t(delta > 0 ? "profile.vsAvg.above" : "profile.vsAvg.below").replace(
                      "{n}",
                      String(Math.abs(delta)),
                    );
            return (
              <article
                key={dim.id}
                className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-signal" />
                    <h3 className="text-base font-semibold">{t(`profile.dim.${dim.id}`)}</h3>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-semibold">
                      {dim.score}
                      <span className="text-sm text-muted-foreground"> /100</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(`profile.band.${bandOf(dim.score as number)}`)}
                    </p>
                  </div>
                </div>
                <Progress value={dim.score ?? 0} className="mt-4" />
                <p className="mt-3 text-sm text-muted-foreground">{t(`profile.desc.${dim.id}`)}</p>
                {context ? <p className="mt-2 text-xs text-foreground/80">{context}</p> : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {t(`profile.evidence.${dim.evidence}`)} · {t(dim.sourceKey)}
                </p>
              </article>
            );
          })}
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link to="/test">
              {t("example.cta")} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/profile">{t("nav.profile")}</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{t("example.footnote")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("profile.disclaimer")}</p>
      </main>
    </div>
  );
}
