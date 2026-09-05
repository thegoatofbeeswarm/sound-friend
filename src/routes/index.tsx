import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, Brain, ExternalLink, Globe2, Headphones, MessagesSquare, ShieldCheck, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SiteNav } from "@/components/SiteNav";
import { HowItWorks } from "@/components/HowItWorks";
import { ExampleProfile } from "@/components/ExampleProfile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Audiomaxxer - Listening Profile & Training for Young People" },
      {
        name: "description",
        content:
          "Built for teens and young adults who live in headphones: measure sensitivity, speech in noise, discrimination, attention and memory, then train your weakest listening skill.",
      },
      { property: "og:title", content: "Audiomaxxer - Listening Profile & Training for Young People" },
      {
        property: "og:description",
        content:
          "Built for teens and young adults who live in headphones: measure sensitivity, speech in noise, discrimination, attention and memory, then train your weakest listening skill.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/** Example five-part listening profile shown in the hero. */
const FIVE = [
  { key: "profile.dim.sensitivity", body: "five.dim.sensitivity.body", value: 82 },
  { key: "profile.dim.speech", body: "five.dim.speech.body", value: 61 },
  { key: "profile.dim.discrimination", body: "five.dim.discrimination.body", value: 76 },
  { key: "profile.dim.attention", body: "five.dim.attention.body", value: 88 },
  { key: "profile.dim.memory", body: "five.dim.memory.body", value: 71 },
] as const;

const OVERALL = 78;

const pillars = [
  { icon: Brain, title: "pillar.adaptive.title", body: "pillar.adaptive.body" },
  { icon: Volume2, title: "pillar.prefs.title", body: "pillar.prefs.body" },
  { icon: Activity, title: "pillar.env.title", body: "pillar.env.body" },
  { icon: Globe2, title: "pillar.access.title", body: "pillar.access.body" },
  { icon: MessagesSquare, title: "pillar.coach.title", body: "pillar.coach.body" },
  { icon: Headphones, title: "pillar.training.title", body: "pillar.training.body" },
] as const;

const adolescentStudies = [
  {
    title: "WHO: over 1 billion young people at risk of hearing loss from unsafe listening",
    source: "World Health Organization / BMJ Global Health, 2022",
    url: "https://www.who.int/news/item/15-11-2022-over-1-billion-young-people-at-risk-of-hearing-loss-from-unsafe-listening-practices",
    finding:
      "A review of 33 studies covering 19,000+ participants found 24% of 12-34 year olds use unsafe listening volumes on personal devices, and 48% are exposed to unsafe levels at venues.",
  },
  {
    title: "Prevalence of hearing loss among US adolescents (NHANES)",
    source: "JAMA / NHANES analyses",
    url: "https://pubmed.ncbi.nlm.nih.gov/20716740/",
    finding:
      "Roughly 1 in 5 US adolescents aged 12-19 showed measurable hearing loss, with high-frequency loss rising significantly between survey cycles.",
  },
  {
    title: "Personal listening devices and hearing thresholds in teenagers",
    source: "Systematic reviews in International Journal of Audiology",
    url: "https://pubmed.ncbi.nlm.nih.gov/28166675/",
    finding:
      "Regular high-volume headphone use is consistently linked to elevated thresholds at 4-6 kHz — the earliest, most easily missed sign of noise damage.",
  },
  {
    title: "Tinnitus and hidden hearing damage in young adults",
    source: "Scientific Reports / Nature, 2022",
    url: "https://www.nature.com/articles/s41598-022-14406-4",
    finding:
      "Young adults with normal audiograms but heavy recreational noise exposure already show measurable difficulty understanding speech in noise.",
  },
];

function Index() {
  const { t } = useI18n();

  return (
    <div className="sky-page min-h-screen text-foreground">
      {/* Sky spans the whole page: dawn in light mode, night sky in dark mode. */}
      <span aria-hidden className="sky-hero-haze" />
      <span aria-hidden className="sky-stars" />
      <section className="relative">
        <SiteNav transparent />

        <div className="mx-auto flex min-h-[86vh] max-w-4xl flex-col items-center justify-center px-5 py-24 text-center">
          <p className="rise-in text-[11px] uppercase tracking-[0.42em] text-foreground/70">
            {t("home.badge")}
          </p>

          <h1
            className="rise-in font-display mt-8 text-balance text-[clamp(2.9rem,9vw,5.75rem)] font-semibold leading-[0.98] text-foreground"
            style={{ animationDelay: "80ms" }}
          >
            {t("home.title1")}{" "}
            <span className="text-primary dark:text-[oklch(0.88_0.07_215)]">{t("home.title2")}</span>
          </h1>

          <p
            className="rise-in mx-auto mt-7 max-w-xl text-base leading-relaxed text-foreground/70 md:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            {t("home.lead")}
          </p>

          <div
            className="rise-in mt-11 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              to="/test"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
            >
              {t("home.ctaTest")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/profile"
              className="inline-flex h-12 items-center rounded-full border border-foreground/25 px-7 text-sm text-foreground/80 backdrop-blur transition-colors hover:border-foreground/50 hover:text-foreground"
            >
              {t("home.ctaProfile")}
            </Link>
            <Link
              to="/train"
              className="inline-flex h-12 items-center rounded-full border border-foreground/25 px-7 text-sm text-foreground/80 backdrop-blur transition-colors hover:border-foreground/50 hover:text-foreground"
            >
              {t("nav.train")}
            </Link>
          </div>

          <p className="mt-14 text-[11px] uppercase tracking-[0.32em] text-foreground/45">
            {t("home.disclaimer")}
          </p>
        </div>
      </section>

      {/* Example listening profile, floating in the dark. */}
      <section>
        <div className="mx-auto max-w-3xl px-5 py-24">
          <div className="rounded-[28px] border border-border/60 bg-card/70 p-7 backdrop-blur-xl md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                {t("five.exampleTitle")}
              </p>
              <span className="rounded-full border border-border/60 px-3 py-1 text-[11px] text-muted-foreground">
                {t("five.exampleBadge")}
              </span>
            </div>

            <div className="mt-7 flex items-baseline gap-4">
              <p className="font-display text-7xl font-semibold leading-none text-foreground">{OVERALL}</p>
              <p className="text-sm text-muted-foreground">{t("five.overall")}</p>
            </div>

            <ul className="mt-9 space-y-5">
              {FIVE.map((d) => (
                <li key={d.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2">
                  <p className="text-sm text-foreground">{t(d.key)}</p>
                  <p className="font-display text-base text-foreground">{d.value}</p>
                  <div className="col-span-2 h-px w-full bg-border/60">
                    <div
                      className="h-px bg-signal"
                      style={{ width: `${d.value}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-7">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                  {t("five.focus")}
                </p>
                <p className="font-display mt-1 text-2xl text-foreground">{t("profile.dim.speech")}</p>
              </div>
              <Link
                to="/train"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border/60 px-6 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {t("five.startTraining")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hearing is more than sensitivity: the five dimensions. */}
      <section className="hairline">
        <div className="mx-auto max-w-5xl px-5 py-24">
          <h2 className="font-display max-w-2xl text-balance text-[clamp(2rem,4.6vw,3.25rem)] font-semibold leading-[1.05] text-foreground">
            {t("five.dimsTitle")}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">{t("five.dimsLead")}</p>

          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border/60 bg-border/60 md:grid-cols-2">
            {FIVE.map((d, i) => (
              <article
                key={d.key}
                className={`bg-card/70 p-8 ${i === FIVE.length - 1 ? "md:col-span-2" : ""}`}
              >
                <p className="text-[11px] tracking-[0.32em] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="font-display mt-4 text-2xl text-foreground">{t(d.key)}</h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{t(d.body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ExampleProfile />

      <HowItWorks />

      {/* Built for the headphone generation. */}
      <section className="hairline">
        <div className="mx-auto max-w-5xl px-5 py-24">
          <h2 className="font-display max-w-2xl text-balance text-[clamp(2rem,4.6vw,3.25rem)] font-semibold leading-[1.05] text-foreground">
            {t("youth.title")}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">{t("youth.lead")}</p>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              { title: "youth.c1.title", body: "youth.c1.body" },
              { title: "youth.c2.title", body: "youth.c2.body" },
              { title: "youth.c3.title", body: "youth.c3.body" },
            ].map((c) => (
              <article key={c.title} className="border-t border-border/60 pt-6">
                <h3 className="font-display text-xl text-foreground">{t(c.title)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(c.body)}</p>
              </article>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap items-end justify-between gap-8 rounded-3xl border border-border/60 bg-card/70 p-8 backdrop-blur">
            <div className="flex items-baseline gap-5">
              <p className="font-display text-6xl font-semibold leading-none text-signal">24%</p>
              <div>
                <p className="max-w-md text-sm text-muted-foreground">{t("youth.statLabel")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("youth.statSource")}</p>
              </div>
            </div>
            <Link
              to="/test"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              {t("youth.cta")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* What's inside. */}
      <section className="hairline">
        <div className="mx-auto max-w-5xl px-5 py-24">
          <h2 className="font-display text-[clamp(2rem,4.6vw,3.25rem)] font-semibold leading-[1.05] text-foreground">
            {t("home.pillarsTitle")}
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-2">
            {pillars.map((p) => (
              <article key={p.title} className="flex gap-5 border-t border-border/60 pt-6">
                <p.icon className="mt-1 h-5 w-5 shrink-0 text-signal" />
                <div>
                  <h3 className="font-display text-xl text-foreground">{t(p.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(p.body)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hairline">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-20 md:grid-cols-3">
          <Dialog>
            <DialogTrigger asChild>
              <button className="group text-left">
                <p className="font-display text-5xl font-semibold text-foreground">1.5B</p>
                <p className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground underline decoration-dotted underline-offset-4 group-hover:text-foreground">
                  {t("stats.people")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </p>
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("studies.title")}</DialogTitle>
                <DialogDescription>{t("studies.desc")}</DialogDescription>
              </DialogHeader>
              <ul className="space-y-4">
                {adolescentStudies.map((s) => (
                  <li key={s.url} className="rounded-xl border border-border/70 bg-card/70 p-4">
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-sm font-semibold underline-offset-4 hover:underline">
                      {s.title}
                    </a>
                    <p className="mt-1 text-xs text-muted-foreground">{s.source}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.finding}</p>
                  </li>
                ))}
              </ul>
            </DialogContent>
          </Dialog>
          {[
            ["10", "stats.tracks"],
            ["~4 min", "stats.time"],
          ].map(([stat, labelKey]) => (
            <div key={labelKey}>
              <p className="font-display text-5xl font-semibold text-foreground">
                {stat === "~4 min" ? t("stats.timeValue") : stat}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{t(labelKey as "stats.tracks" | "stats.time")}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="hairline">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-5 py-10 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          {t("footer.note")}
        </div>
      </footer>
    </div>
  );
}
