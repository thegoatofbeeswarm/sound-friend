import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
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

const FIVE = [
  { key: "profile.dim.sensitivity", body: "five.dim.sensitivity.body", value: 82 },
  { key: "profile.dim.speech", body: "five.dim.speech.body", value: 61 },
  { key: "profile.dim.discrimination", body: "five.dim.discrimination.body", value: 76 },
  { key: "profile.dim.attention", body: "five.dim.attention.body", value: 88 },
  { key: "profile.dim.memory", body: "five.dim.memory.body", value: 71 },
] as const;

const OVERALL = 78;

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

/** Hero score sheet, presented like a printed cover plate. */
function ScorePlate() {
  const { t } = useI18n();
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="press-card press-tilt-2 absolute -right-2 top-8 hidden h-[85%] w-[86%] rounded-sm md:block" />
      <div className="press-card press-tilt-3 absolute -left-3 top-4 hidden h-[90%] w-[90%] rounded-sm md:block" />

      <article className="press-card press-tilt-1 relative rounded-sm p-6">
        <div className="flex items-center justify-between border-b border-foreground/15 pb-3">
          <p className="press-label text-foreground/60">{t("five.exampleTitle")}</p>
          <span className="press-label bg-primary px-2 py-1 text-primary-foreground">
            {t("five.exampleBadge")}
          </span>
        </div>

        <div className="mt-6 flex items-end gap-3">
          <p className="press-display text-[5.5rem] leading-[0.8] text-foreground">{OVERALL}</p>
          <p className="press-label pb-2 text-foreground/60">{t("five.overall")}</p>
        </div>

        <ul className="mt-7 space-y-4">
          {FIVE.map((d) => (
            <li key={d.key}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="press-label text-foreground/75">{t(d.key)}</p>
                <p className="press-display text-sm text-foreground">{d.value}</p>
              </div>
              <div className="mt-1.5 h-[3px] w-full bg-foreground/10">
                <div className="h-[3px] bg-signal" style={{ width: `${d.value}%` }} />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex items-center justify-between border-t border-foreground/15 pt-4">
          <div>
            <p className="press-label text-foreground/55">{t("five.focus")}</p>
            <p className="press-display mt-1 text-xl text-foreground">{t("profile.dim.speech")}</p>
          </div>
          <Link
            to="/train"
            className="press-label inline-flex items-center gap-2 border border-foreground/25 px-4 py-2 text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            {t("five.startTraining")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </article>
    </div>
  );
}

export function PressHome() {
  const { t } = useI18n();

  return (
    <div className="press-theme press-grain min-h-screen">
      <div className="relative z-10">
        <SiteNav transparent />

        {/* Masthead ticker */}
        <div className="mt-16 border-y border-foreground/15">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2.5">
            <p className="press-label text-foreground/70">{t("home.badge")}</p>
            <div className="hidden items-center gap-1.5 md:flex">
              <span className="h-2.5 w-6 bg-signal" />
              <span className="h-2.5 w-6 bg-primary" />
              <span className="h-2.5 w-6 bg-[oklch(0.78_0.12_92)]" />
              <span className="h-2.5 w-6 bg-foreground" />
            </div>
            <p className="press-label text-signal">5 SKILLS — 1 PROFILE</p>
          </div>
        </div>

        {/* Hero plate */}
        <section className="mx-auto max-w-6xl px-5 py-8">
          <div className="press-frame px-5 py-10 md:px-12 md:py-16">
            <p className="press-side absolute -left-6 top-1/2 hidden -translate-y-1/2 text-foreground/35 md:block press-label">
              AUDIOMAXXER · LISTENING STUDIES · ORIGINAL PRINT AREA
            </p>

            <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="press-label bg-primary px-3 py-1.5 text-primary-foreground">
                    THE LISTENING ARCHIVE
                  </span>
                  <span className="press-label text-foreground/55">MEASURED, NOT GUESSED</span>
                </div>

                <h1 className="press-display mt-8 text-[clamp(2.8rem,8.5vw,5.6rem)] leading-[0.86] text-foreground">
                  <span className="block">{t("home.title1")}</span>
                  <span className="mt-1 block text-signal">{t("home.title2")}</span>
                </h1>

                <p className="mt-8 max-w-md text-base leading-relaxed text-foreground/75">
                  {t("home.lead")}
                </p>

                <p className="press-label mt-6 max-w-md leading-[1.9] text-foreground/45">
                  {t("home.disclaimer")}
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Link
                    to="/test"
                    className="press-label inline-flex items-center gap-3 bg-primary px-7 py-4 text-primary-foreground transition-transform hover:-translate-y-0.5"
                  >
                    {t("home.ctaTest")} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/profile"
                    className="press-label inline-flex items-center px-5 py-4 text-foreground underline decoration-signal decoration-2 underline-offset-8"
                  >
                    {t("home.ctaProfile")}
                  </Link>
                  <Link
                    to="/train"
                    className="press-label inline-flex items-center px-5 py-4 text-foreground/70 hover:text-foreground"
                  >
                    {t("nav.train")}
                  </Link>
                </div>
              </div>

              <ScorePlate />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="press-label text-foreground/50">MEASURE. TRAIN. RETEST.</p>
            <p className="press-label inline-flex items-center gap-2 text-foreground/50">
              SCROLL TO DISCOVER <ArrowDown className="h-3.5 w-3.5" />
            </p>
          </div>
        </section>

        {/* Five dimensions, set as a print grid */}
        <section className="border-t border-foreground/15">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="press-label text-primary">01 — THE FIVE PLATES</p>
            <h2 className="press-display mt-4 max-w-3xl text-[clamp(1.9rem,4.4vw,3.1rem)] leading-[0.95] text-foreground">
              {t("five.dimsTitle")}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-foreground/65">
              {t("five.dimsLead")}
            </p>

            <div className="mt-12 grid gap-px border border-foreground/15 bg-foreground/15 md:grid-cols-2">
              {FIVE.map((d, i) => (
                <article
                  key={d.key}
                  className={`bg-card p-8 transition-colors hover:bg-muted ${
                    i === FIVE.length - 1 ? "md:col-span-2" : ""
                  }`}
                >
                  <p className="press-label text-signal">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="press-display mt-4 text-2xl text-foreground">{t(d.key)}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/65">
                    {t(d.body)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <ExampleProfile />

        <HowItWorks />

        {/* Headphone generation */}
        <section className="border-t border-foreground/15">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="press-label text-primary">03 — THE HEADPHONE GENERATION</p>
            <h2 className="press-display mt-4 max-w-3xl text-[clamp(1.9rem,4.4vw,3.1rem)] leading-[0.95] text-foreground">
              {t("youth.title")}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-foreground/65">{t("youth.lead")}</p>

            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {[
                { title: "youth.c1.title", body: "youth.c1.body" },
                { title: "youth.c2.title", body: "youth.c2.body" },
                { title: "youth.c3.title", body: "youth.c3.body" },
              ].map((c) => (
                <article key={c.title} className="border-t-2 border-foreground pt-5">
                  <h3 className="press-display text-lg text-foreground">{t(c.title)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/65">{t(c.body)}</p>
                </article>
              ))}
            </div>

            <div className="press-card mt-14 flex flex-wrap items-end justify-between gap-8 rounded-sm p-8">
              <div className="flex items-baseline gap-5">
                <p className="press-display text-[4.5rem] leading-none text-primary">24%</p>
                <div>
                  <p className="max-w-md text-sm text-foreground/70">{t("youth.statLabel")}</p>
                  <p className="press-label mt-2 text-foreground/50">{t("youth.statSource")}</p>
                </div>
              </div>
              <Link
                to="/test"
                className="press-label inline-flex items-center gap-2 bg-foreground px-6 py-4 text-background transition-transform hover:-translate-y-0.5"
              >
                {t("youth.cta")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Stats colophon */}
        <section className="border-t border-foreground/15">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-3">
            <Dialog>
              <DialogTrigger asChild>
                <button className="group text-left">
                  <p className="press-display text-5xl text-foreground">1.5B</p>
                  <p className="press-label mt-3 inline-flex items-center gap-1 text-foreground/60 group-hover:text-foreground">
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
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold underline-offset-4 hover:underline"
                      >
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
                <p className="press-display text-5xl text-foreground">
                  {stat === "~4 min" ? t("stats.timeValue") : stat}
                </p>
                <p className="press-label mt-3 text-foreground/60">
                  {t(labelKey as "stats.tracks" | "stats.time")}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-foreground/15">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8">
            <p className="inline-flex items-center gap-2 text-xs text-foreground/60">
              <ShieldCheck className="h-4 w-4" />
              {t("footer.note")}
            </p>
            <p className="press-label text-foreground/45">COLLECT SIGNAL, NOT NOISE.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
