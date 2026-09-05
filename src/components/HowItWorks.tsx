import { Link } from "@tanstack/react-router";
import { BarChart3, Brain, Dumbbell, LineChart, RefreshCw, Waves } from "lucide-react";
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
    <section className="hairline ">
      <div className="mx-auto max-w-5xl px-5 py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[clamp(2rem,4.6vw,3.25rem)] font-semibold leading-[1.05] text-foreground">{t("how.title")}</h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t("how.lead")}
            </p>
          </div>
          <Link
            to="/science"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <BarChart3 className="h-4 w-4 text-signal" /> {t("how.scienceLink")}
          </Link>
        </div>

        <ol className="mt-14 space-y-0">
          {steps.map((s, i) => (
            <li key={s.n}>
              <article className="flex items-start gap-6 border-t border-border/60 py-8 transition-colors hover:bg-muted/30">
                <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60">
                  <s.icon className="h-5 w-5 text-signal" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] tracking-[0.32em] text-muted-foreground">
                    {t("how.step")} {s.n}
                  </p>
                  <h3 className="font-display mt-2 text-2xl text-foreground">{t(`how.${s.key}.title`)}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {t(`how.${s.key}.body`)}
                  </p>
                </div>
              </article>

            </li>
          ))}
        </ol>

        <div className="mt-10 flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-6 text-sm text-muted-foreground backdrop-blur">
          <RefreshCw className="h-4 w-4 shrink-0 text-signal" />
          <p>{t("how.loop")}</p>
        </div>
      </div>
    </section>
  );
}
