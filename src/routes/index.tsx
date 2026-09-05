import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Brain, ExternalLink, Globe2, Headphones, MessagesSquare, ShieldCheck, Volume2, Waves } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SiteNav } from "@/components/SiteNav";
import { ExampleProfile } from "@/components/ExampleProfile";
import { HowItWorks } from "@/components/HowItWorks";
import { SoundwaveGlow } from "@/components/SoundwaveGlow";


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
    <div className="min-h-screen">
      <SiteNav />

      <section className="night-surface border-b border-border/60">
        <SoundwaveGlow />
        <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-night-border bg-white/5 px-3 py-1 text-xs text-night-muted backdrop-blur">
              <Waves className="h-3.5 w-3.5 text-night-accent" /> {t("home.badge")}
            </span>
            <h1 className="mt-7 text-balance text-5xl font-semibold leading-[1.03] tracking-tight md:text-6xl">
              {t("home.title1")}{" "}
              <span className="bg-gradient-to-r from-[oklch(0.86_0.1_200)] via-[oklch(0.8_0.13_230)] to-[oklch(0.75_0.14_290)] bg-clip-text text-transparent">
                {t("home.title2")}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-night-muted">{t("home.lead")}</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/profile">{t("home.ctaProfile")}</Link>
              </Button>
              <Link
                to="/test"
                className="glass-panel inline-flex h-11 items-center rounded-xl px-6 text-sm font-medium text-night-foreground transition-colors hover:bg-white/10"
              >
                {t("home.ctaTest")}
              </Link>
              <Link
                to="/train"
                className="glass-panel inline-flex h-11 items-center rounded-xl px-6 text-sm font-medium text-night-foreground transition-colors hover:bg-white/10"
              >
                {t("nav.train")}
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-3xl">
            <div className="glass-panel rounded-3xl p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-widest text-night-muted">
                  {t("five.exampleTitle")}
                </p>
                <span className="rounded-full border border-night-border px-2.5 py-1 text-[11px] text-night-muted">
                  {t("five.exampleBadge")}
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-3">
                <p className="font-display text-6xl font-semibold text-night-foreground">{OVERALL}</p>
                <p className="text-sm text-night-muted">{t("five.overall")}</p>
              </div>

              <ul className="mt-6 space-y-3">
                {FIVE.map((d) => (
                  <li key={d.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
                    <p className="text-sm text-night-foreground">{t(d.key)}</p>
                    <p className="font-display text-sm font-semibold text-night-foreground">{d.value}</p>
                    <div className="col-span-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[oklch(0.8_0.13_200)] to-[oklch(0.72_0.15_285)]"
                        style={{ width: `${d.value}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-night-border bg-white/5 p-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-night-muted">
                    {t("five.focus")}
                  </p>
                  <p className="mt-1 text-base font-semibold text-night-foreground">
                    {t("profile.dim.speech")}
                  </p>
                </div>
                <Button asChild>
                  <Link to="/train">{t("five.startTraining")}</Link>
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-night-muted">{t("home.disclaimer")}</p>
        </div>
      </section>

      <ExampleProfile />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-semibold">{t("five.dimsTitle")}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t("five.dimsLead")}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FIVE.map((d) => (
              <article
                key={d.key}
                className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card"
              >
                <h3 className="text-lg font-semibold">{t(d.key)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(d.body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />

      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-semibold">{t("youth.title")}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t("youth.lead")}</p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: Waves, title: "youth.c1.title", body: "youth.c1.body" },
              { icon: MessagesSquare, title: "youth.c2.title", body: "youth.c2.body" },
              { icon: ShieldCheck, title: "youth.c3.title", body: "youth.c3.body" },
            ].map((c) => (
              <article key={c.title} className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
                <c.icon className="h-5 w-5 text-signal" />
                <h3 className="mt-4 text-lg font-semibold">{t(c.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(c.body)}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-border/70 bg-card/70 p-6">
            <div className="flex items-baseline gap-4">
              <p className="font-display text-5xl font-semibold text-signal">24%</p>
              <div>
                <p className="max-w-md text-sm text-muted-foreground">{t("youth.statLabel")}</p>
                <p className="mt-1 text-xs text-muted-foreground/80">{t("youth.statSource")}</p>
              </div>
            </div>
            <Button asChild size="lg">
              <Link to="/test">{t("youth.cta")}</Link>
            </Button>
          </div>
        </div>
      </section>


      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-3xl font-semibold">{t("home.pillarsTitle")}</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {pillars.map((p) => (
            <article key={p.title} className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
              <p.icon className="h-5 w-5 text-signal" />
              <h3 className="mt-4 text-lg font-semibold">{t(p.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(p.body)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-3">
          <Dialog>
            <DialogTrigger asChild>
              <button className="group text-left">
                <p className="font-display text-4xl font-semibold text-signal">1.5B</p>
                <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground underline decoration-dotted underline-offset-4 group-hover:text-foreground">
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
                  <li key={s.url} className="rounded-xl border border-border/70 bg-card/60 p-4">
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
              <p className="font-display text-4xl font-semibold text-signal">{stat === "~4 min" ? t("stats.timeValue") : stat}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t(labelKey as "stats.tracks" | "stats.time")}</p>
            </div>
          ))}
        </div>
      </section>


      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-8 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          {t("footer.note")}
        </div>
      </footer>
    </div>
  );
}
