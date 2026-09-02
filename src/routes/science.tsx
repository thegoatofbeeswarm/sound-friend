import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BookOpen, ExternalLink } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/science")({
  head: () => ({
    meta: [
      { title: "The science behind Audiomaxxer — methods, evidence, limits" },
      {
        name: "description",
        content:
          "How Audiomaxxer estimates hearing thresholds, why adaptive auditory training works, what ambient noise does to a screening, and where our limits are.",
      },
      { property: "og:title", content: "The science behind Audiomaxxer" },
      {
        property: "og:description",
        content:
          "Bayesian threshold estimation, auditory training evidence, safe-listening guidance, and an honest list of limitations.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SciencePage,
});

const sections = [
  {
    title: "Adaptive threshold estimation",
    body: [
      "A classic audiogram plays fixed tones and steps the level up and down until the listener stops responding. That works, but it spends most of its trials on levels that tell you almost nothing.",
      "Audiomaxxer instead keeps a probability distribution over your threshold at each frequency and ear, updates it after every answer, and puts the next tone where uncertainty is highest — a Bayesian adaptive procedure. The psychometric model carries explicit guess and lapse rates so an occasional stray or missed press does not distort the estimate, and the run stops when the estimate is stable rather than after a fixed number of tones.",
      "The result is a threshold estimate per ear per frequency with a confidence attached to it, in roughly four minutes.",
    ],
  },
  {
    title: "Auditory training",
    body: [
      "Hearing is not only the ear. Understanding speech in a noisy room depends on how the brain separates a target voice from competing sound, and that separation improves with practice — the effect audiologists call auditory or perceptual learning.",
      "Training works best when it is targeted and difficulty-adaptive: exercises should sit just above what you currently manage, and should use the frequency regions and listening situations where your own profile is weakest. Generic listening practice at a fixed difficulty produces much smaller gains.",
      "This is why our training reads your screening profile rather than offering everyone the same exercise list. Improvements are in listening performance; training does not repair damaged cochlear hair cells.",
    ],
  },
  {
    title: "Environmental noise control",
    body: [
      "Background noise raises the level at which a tone becomes audible, so a screening taken in a noisy room reports thresholds that look worse than your real ones — especially at low frequencies, where room noise is loudest.",
      "Audiomaxxer measures ambient level through the microphone before and during a screening and flags a run taken in a noisy environment instead of silently recording an inflated threshold. Quiet rooms produce comparisons you can trust across months.",
    ],
  },
  {
    title: "Safe listening",
    body: [
      "The WHO Make Listening Safe guidance and the IEC/WHO global standard for personal audio devices frame risk as a dose: level combined with duration, tracked over a week, rather than a single loudness threshold.",
      "The WHO reports that over 1 billion people aged 12-35 are at risk from unsafe recreational listening, and that more than 1.5 billion people live with some degree of hearing loss.",
      "Audiomaxxer therefore describes your listening behaviour — estimated exposure, loudest sessions, weekly trend — rather than claiming a personally validated medical exposure limit derived from your thresholds.",
    ],
  },
];

const limitations = [
  "Browser and operating-system volume are not known to the app, so absolute decibel values depend on your device settings.",
  "Headphone frequency responses differ substantially. We apply per-model corrections for the models we list; anything else is uncalibrated and best used for relative tracking.",
  "Phone and laptop microphones are not calibrated sound level meters — noise and exposure readings are estimates.",
  "Attention, fatigue, and response strategy affect any behavioural hearing test, including this one.",
  "Audiomaxxer is a screening and training tool. It does not diagnose hearing loss, tinnitus, or any medical condition, and it cannot detect conductive or middle-ear problems. See an audiologist for a clinical audiogram.",
];

const references = [
  {
    title: "WHO — Over 1 billion young people at risk of hearing loss from unsafe listening practices",
    source: "World Health Organization / BMJ Global Health, 2022",
    url: "https://www.who.int/news/item/15-11-2022-over-1-billion-young-people-at-risk-of-hearing-loss-from-unsafe-listening-practices",
  },
  {
    title: "WHO — Deafness and hearing loss fact sheet (1.5 billion people affected)",
    source: "World Health Organization",
    url: "https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss",
  },
  {
    title: "WHO — Make Listening Safe / global standard for safe listening devices",
    source: "World Health Organization, 2022",
    url: "https://www.who.int/activities/making-listening-safe",
  },
  {
    title: "Kontsevich & Tyler — Bayesian adaptive estimation of psychometric slope and threshold",
    source: "Vision Research, 1999",
    url: "https://pubmed.ncbi.nlm.nih.gov/10493606/",
  },
  {
    title: "Watson & Pelli — QUEST: a Bayesian adaptive psychometric method",
    source: "Perception & Psychophysics, 1983",
    url: "https://pubmed.ncbi.nlm.nih.gov/6844102/",
  },
  {
    title: "Ferguson et al. — Auditory training can improve working memory, attention and communication in adults",
    source: "Journal of Speech, Language, and Hearing Research, 2014",
    url: "https://pubmed.ncbi.nlm.nih.gov/24686468/",
  },
  {
    title: "Henshaw & Ferguson — Efficacy of individual computer-based auditory training for people with hearing loss: a systematic review",
    source: "PLOS ONE, 2013",
    url: "https://pubmed.ncbi.nlm.nih.gov/23675431/",
  },
  {
    title: "Shargorodsky et al. — Change in prevalence of hearing loss in US adolescents",
    source: "JAMA, 2010",
    url: "https://pubmed.ncbi.nlm.nih.gov/20716740/",
  },
  {
    title: "Liberman et al. — Cochlear synaptopathy in humans with normal audiograms",
    source: "PLOS ONE / Scientific Reports",
    url: "https://pubmed.ncbi.nlm.nih.gov/27618300/",
  },
];

function SciencePage() {
  return (
    <div className="min-h-screen">
      <SiteNav />

      <section className="hero-surface border-b border-border/60">
        <div className="mx-auto max-w-4xl px-5 py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 text-signal" /> Methods & evidence
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">The science behind Audiomaxxer</h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground">
            What we measure, why the methods are chosen, where the evidence comes from, and — just as important —
            what this app cannot tell you.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-5 px-5 py-14">
        {sections.map((s) => (
          <article key={s.title} className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
            <h2 className="text-xl font-semibold">{s.title}</h2>
            {s.body.map((p) => (
              <p key={p.slice(0, 32)} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </article>
        ))}

        <article className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <AlertTriangle className="h-5 w-5 text-signal" /> Limitations
          </h2>
          <ul className="mt-4 space-y-3">
            {limitations.map((l) => (
              <li key={l.slice(0, 32)} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                {l}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <h2 className="text-xl font-semibold">References</h2>
          <ul className="mt-4 space-y-4">
            {references.map((r) => (
              <li key={r.url}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-start gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
                >
                  {r.title}
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                </a>
                <p className="mt-1 text-xs text-muted-foreground">{r.source}</p>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
