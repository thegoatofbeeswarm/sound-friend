import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { Audiogram } from "@/components/charts/lazy";
import { Button } from "@/components/ui/button";
import type { ThresholdResult } from "@/lib/audiometry";
import { useI18n } from "@/lib/i18n";

const EXAMPLE_POINTS: ThresholdResult[] = [
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

const FINDING_KEYS = ["example.finding1", "example.finding2", "example.finding3"] as const;

export function ExampleProfile() {
  const { t } = useI18n();
  return (
    <section className="border-b border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">{t("example.title")}</h2>
              <span className="rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground">
                {t("example.badge")}
              </span>
            </div>
            <div className="mt-4">
              <Audiogram points={EXAMPLE_POINTS} />
            </div>
          </div>

          <div>
            <p className="inline-flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-signal" /> {t("example.detected")}
            </p>
            <ul className="mt-4 space-y-3">
              {FINDING_KEYS.map((key) => (
                <li
                  key={key}
                  className="rounded-xl border border-border/70 bg-card/60 p-4 text-sm leading-relaxed text-muted-foreground"
                >
                  {t(key)}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-6">
              <Link to="/test">
                {t("example.cta")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("example.footnote")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
