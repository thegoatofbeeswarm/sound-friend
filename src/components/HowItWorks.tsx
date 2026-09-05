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
    <section className="hairline bg-night-deep">
      <div className="mx-auto max-w-5xl px-5 py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[clamp(2rem,4.6vw,3.25rem)] font-semibold leading-[1.05] text-white">{t("how.title")}</h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/60">
              {t("how.lead")}
            </p>
          </div>
          <Link
            to="/science"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-sm text-white/70 transition-colors hover:border-white/40 hover:text-white"
          >
            <BarChart3 className="h-4 w-4 text-[oklch(0.88_0.08_215)]" /> {t("how.scienceLink")}
          </Link>
        </div>

        <ol className="mt-14 space-y-0">
          {steps.map((s, i) => (
            <li key={s.n}>
              <article className="flex items-start gap-6 border-t border-white/10 py-8 transition-colors hover:bg-white/[0.02]">
                <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12">
                  <s.icon className="h-5 w-5 text-[oklch(0.88_0.08_215)]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] tracking-[0.32em] text-white/35">
                    {t("how.step")} {s.n}
                  </p>
                  <h3 className="font-display mt-2 text-2xl text-white">{t(`how.${s.key}.title`)}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
                    {t(`how.${s.key}.body`)}
                  </p>
                </div>
              </article>

            </li>
          ))}
        </ol>

        <div className="mt-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-sm text-white/65 backdrop-blur">
          <RefreshCw className="h-4 w-4 shrink-0 text-[oklch(0.88_0.08_215)]" />
          <p>{t("how.loop")}</p>
        </div>
      </div>
    </section>
  );
}
