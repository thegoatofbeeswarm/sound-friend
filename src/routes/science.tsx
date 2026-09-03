import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ExternalLink, FlaskConical } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { scienceLinks } from "@/lib/science-links";

const TITLE = "The Science Behind Audiomaxxer — Methods, Evidence, Limits";
const DESCRIPTION =
  "Explore Audiomaxxer's hearing science: online hearing tests, audiograms, hearing thresholds, Bayesian testing, safe listening, headphone accuracy and limitations.";

export const Route = createFileRoute("/science")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://audiomaxxer.app/science" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomaxxer.app/science" }],
  }),
  component: SciencePage,
});

const topicGroups = [
  {
    label: "Understand the test",
    links: [scienceLinks.howTestsWork, scienceLinks.audiogram, scienceLinks.thresholds],
  },
  {
    label: "Understand the method",
    links: [scienceLinks.bayesian, scienceLinks.headphones],
  },
  {
    label: "Protect your hearing",
    links: [scienceLinks.prevention],
  },
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
    title:
      "Ferguson MA & Henshaw H — Auditory training can improve working memory, attention, and communication in adverse conditions for adults with hearing loss",
    source: "Frontiers in Psychology, 2015; 6:556",
    url: "https://pubmed.ncbi.nlm.nih.gov/25999877/",
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
    title: "Liberman et al. — Toward a Differential Diagnosis of Hidden Hearing Loss in Humans",
    source: "PLOS ONE, 2016; 11(9):e0162726",
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

      <main className="mx-auto max-w-4xl space-y-8 px-5 py-14">
        {topicGroups.map((group) => (
          <section key={group.label}>
            <h2 className="text-xl font-semibold">{group.label}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {group.links.map((topic) => (
                <Link
                  key={topic.to}
                  to={topic.to}
                  className="rounded-2xl border border-border/70 bg-card/70 p-5 shadow-card transition-colors hover:border-signal/60"
                >
                  <h3 className="text-base font-semibold">{topic.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{topic.blurb}</p>
                  <span className="mt-4 inline-flex text-xs font-medium text-signal">Read the guide →</span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <FlaskConical className="h-5 w-5 text-signal" /> Our position on evidence
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Audiomaxxer is a hearing screening and listening-training tool, not a diagnostic device. Adaptive and
            task-specific training may improve learning efficiency and transfer, although the magnitude of benefit
            varies across studies and populations. Training improves listening performance; it does not repair damaged
            cochlear hair cells.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Consumer headphones, browser volume, room noise and behaviour limit the precision of an online test. Our
            results are best used to follow your own patterns over time, not as a substitute for a clinical assessment.
          </p>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <h2 className="text-xl font-semibold">References</h2>
          <ul className="mt-4 space-y-4">
            {references.map((reference) => (
              <li key={reference.url}>
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-start gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
                >
                  {reference.title}
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                </a>
                <p className="mt-1 text-xs text-muted-foreground">{reference.source}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
