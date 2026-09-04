import { CheckCircle2, Gauge, TriangleAlert } from "lucide-react";
import { qualityTone, type QualityMessage, type QualityResult } from "@/lib/test-quality";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  const tone = qualityTone(quality.tier);

  const msg = (m: QualityMessage) => {
    let text = t(m.key);
    for (const [k, v] of Object.entries(m.vals ?? {})) {
      text = text.replace(`{${k}}`, String(v));
    }
    return text;
  };

  const label = t(quality.labelKey);
  const interpretation = t(quality.interpretationKey);

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 rounded-xl border bg-card/60 px-4 py-3 ${RING[tone]} ${className}`}
      >
        <Gauge className="h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {t("quality.compact").replace("{score}", String(quality.score)).replace("{label}", label)}
          </p>
          <p className="truncate text-xs text-muted-foreground">{interpretation}</p>
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
          <h2 className="text-lg font-semibold">
            {t("quality.heading").replace("{label}", label)}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{interpretation}</p>
        </div>
      </div>

      {quality.issueItems.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {quality.issueItems.map((i) => (
            <li key={i.key} className="flex items-start gap-2 text-sm text-muted-foreground">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-caution" />
              <span>{msg(i)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {quality.strengthItems.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {quality.strengthItems.map((s) => (
            <li key={s.key} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
              <span>{msg(s)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
