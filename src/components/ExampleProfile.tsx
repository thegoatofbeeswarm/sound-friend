import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { Audiogram } from "@/components/Audiogram";
import { Button } from "@/components/ui/button";
import type { ThresholdResult } from "@/lib/audiometry";

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

const FINDINGS = [
  "Strong low-frequency hearing",
  "Slightly reduced sensitivity at 4–8 kHz",
  "Recommended training: speech-in-noise + high-frequency recognition",
];

export function ExampleProfile() {
  return (
    <section className="border-b border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">Your Hearing Profile</h2>
              <span className="rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground">
                Example result
              </span>
            </div>
            <div className="mt-4">
              <Audiogram points={EXAMPLE_POINTS} />
            </div>
          </div>

          <div>
            <p className="inline-flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-signal" /> Audiomaxxer detected
            </p>
            <ul className="mt-4 space-y-3">
              {FINDINGS.map((f) => (
                <li
                  key={f}
                  className="rounded-xl border border-border/70 bg-card/60 p-4 text-sm leading-relaxed text-muted-foreground"
                >
                  {f}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-6">
              <Link to="/test">
                See what your hearing looks like <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Illustrative data — your own screening takes about four minutes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
