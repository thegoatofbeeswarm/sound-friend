import { CheckCircle2, Gauge, TriangleAlert } from "lucide-react";
import { qualityTone, type QualityResult } from "@/lib/test-quality";

const RING: Record<"ok" | "watch" | "risk", string> = {
  ok: "border-signal/40 text-signal",
  watch: "border-caution/50 text-caution",
  risk: "border-danger/50 text-danger",
};

export function ScreeningQuality({
  quality,
  compact,
  className = "",
}: {
  quality: QualityResult;
  compact?: boolean;
  className?: string;
}) {
  const tone = qualityTone(quality.tier);

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 rounded-xl border bg-card/60 px-4 py-3 ${RING[tone]} ${className}`}
      >
        <Gauge className="h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            Screening quality {quality.score}/100 · {quality.label}
          </p>
          <p className="truncate text-xs text-muted-foreground">{quality.interpretation}</p>
        </div>
      </div>
    );
  }

  return (
    <section
      className={`rounded-2xl border border-border/70 bg-card/60 p-5 shadow-card ${className}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 ${RING[tone]}`}
        >
          <span className="font-display text-xl font-semibold leading-none">{quality.score}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">/100</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Screening quality — {quality.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{quality.interpretation}</p>
        </div>
      </div>

      {quality.issues.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {quality.issues.map((i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-caution" />
              <span>{i}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {quality.strengths.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {quality.strengths.map((s) => (
            <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
