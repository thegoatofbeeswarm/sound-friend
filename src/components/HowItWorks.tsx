import { Link } from "@tanstack/react-router";
import { ArrowDown, BarChart3, Brain, Dumbbell, LineChart, RefreshCw, Waves } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const steps = [
  { n: "01", icon: Waves, key: "s1" },
  { n: "02", icon: Brain, key: "s2" },
  { n: "03", icon: Dumbbell, key: "s3" },
  { n: "04", icon: RefreshCw, key: "s4" },
  { n: "05", icon: LineChart, key: "s5" },
] as const;

export function HowItWorks() {
  const { t } = useI18n();

  return (
    <section className="border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">{t("how.title")}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("how.lead")}
            </p>
          </div>
          <Link
            to="/science"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <BarChart3 className="h-4 w-4 text-signal" /> {t("how.scienceLink")}
          </Link>
        </div>

        <ol className="mt-10 space-y-3">
          {steps.map((s, i) => (
            <li key={s.n}>
              <article className="flex items-start gap-4 rounded-2xl border border-border/70 bg-card/70 p-5 shadow-card transition-transform hover:-translate-y-0.5">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/60">
                  <s.icon className="h-5 w-5 text-signal" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium tracking-widest text-muted-foreground">
                    {t("how.step")} {s.n}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{t(`how.${s.key}.title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t(`how.${s.key}.body`)}
                  </p>
                </div>
              </article>
              {i < steps.length - 1 ? (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-background/40 p-5 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 shrink-0 text-signal" />
          <p>{t("how.loop")}</p>
        </div>
      </div>
    </section>
  );
}
