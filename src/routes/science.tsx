import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ExternalLink, FlaskConical } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { scienceLinks } from "@/lib/science-links";
import { useI18n } from "@/lib/i18n";

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
    labelKey: "sci.group.test",
    links: [scienceLinks.hearingVsListening, scienceLinks.speechInNoise, scienceLinks.howTestsWork, scienceLinks.audiogram, scienceLinks.thresholds],
  },
  {
    labelKey: "sci.group.method",
    links: [scienceLinks.bayesian, scienceLinks.reliability, scienceLinks.headphones],
  },
  {
    labelKey: "sci.group.protect",
    links: [scienceLinks.prevention, scienceLinks.headphoneGeneration],
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
  const { t } = useI18n();
  return (
    <div className="min-h-screen">
      <SiteNav />
      <section className="hero-surface border-b border-border/60">
        <div className="mx-auto max-w-4xl px-5 py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 text-signal" /> {t("sci.badge")}
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">{t("sci.h1")}</h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground">{t("sci.lead")}</p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl space-y-8 px-5 py-14">
        {topicGroups.map((group) => (
          <section key={group.labelKey}>
            <h2 className="text-xl font-semibold">{t(group.labelKey)}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {group.links.map((topic) => (
                <Link
                  key={topic.to}
                  to={topic.to}
                  className="rounded-2xl border border-border/70 bg-card/70 p-5 shadow-card transition-colors hover:border-signal/60"
                >
                  <h3 className="text-base font-semibold">{t(`sci.link.${topic.key}.label`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`sci.link.${topic.key}.blurb`)}
                  </p>
                  <span className="mt-4 inline-flex text-xs font-medium text-signal">{t("sci.read")}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
        <p className="text-xs text-muted-foreground">{t("sci.note")}</p>

        <section className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <FlaskConical className="h-5 w-5 text-signal" /> {t("sci.position.title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("sci.position.p1")}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("sci.position.p2")}</p>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <h2 className="text-xl font-semibold">{t("sci.references")}</h2>
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
