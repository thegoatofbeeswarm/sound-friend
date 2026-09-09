import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, ExternalLink } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import AuditoryPathway from "@/components/AuditoryPathway";
import { useI18n } from "@/lib/i18n";

const TITLE = "The auditory pathway — from your ear to your auditory cortex";
const DESCRIPTION =
  "Follow a sound from the cochlea through the cochlear nucleus, superior olive, inferior colliculus and thalamus to the auditory cortex, and see how each relay shapes what you understand.";

export const Route = createFileRoute("/auditory-pathway")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://audiomaxxer.app/auditory-pathway" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomaxxer.app/auditory-pathway" }],
  }),
  component: AuditoryPathwayPage,
});

const references = [
  {
    title:
      "Picton et al. — Human auditory evoked potentials I: evaluation of components",
    source: "Electroencephalography and Clinical Neurophysiology, 1974",
    url: "https://pubmed.ncbi.nlm.nih.gov/4136714/",
  },
  {
    title: "Greenwood — A cochlear frequency-position function for several species",
    source: "Journal of the Acoustical Society of America, 1990",
    url: "https://pubmed.ncbi.nlm.nih.gov/2373794/",
  },
  {
    title:
      "Grothe, Pecka & McAlpine — Mechanisms of sound localization in mammals",
    source: "Physiological Reviews, 2010; 90(3):983–1012",
    url: "https://pubmed.ncbi.nlm.nih.gov/20664077/",
  },
  {
    title: "Bregman — Auditory Scene Analysis: The Perceptual Organization of Sound",
    source: "MIT Press, 1990",
    url: "https://mitpress.mit.edu/9780262521956/auditory-scene-analysis/",
  },
  {
    title:
      "Pichora-Fuller et al. — Hearing impairment and cognitive energy: the Framework for Understanding Effortful Listening",
    source: "Ear and Hearing, 2016; 37 Suppl 1:5S–27S",
    url: "https://pubmed.ncbi.nlm.nih.gov/27355771/",
  },
  {
    title:
      "Livingston et al. — Dementia prevention, intervention, and care: 2020 report of the Lancet Commission",
    source: "The Lancet, 2020; 396(10248):413–446",
    url: "https://pubmed.ncbi.nlm.nih.gov/32738937/",
  },
  {
    title:
      "Ferguson & Henshaw — Auditory training can improve working memory, attention and communication in adverse conditions",
    source: "Frontiers in Psychology, 2015; 6:556",
    url: "https://pubmed.ncbi.nlm.nih.gov/25999877/",
  },
];

function AuditoryPathwayPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen">
      <SiteNav />

      <section className="hero-surface border-b border-border/60">
        <div className="mx-auto max-w-4xl px-5 py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <Brain className="h-3.5 w-3.5 text-signal" /> {t("path.badge")}
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">{t("path.h1")}</h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground">{t("path.lead")}</p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-14">
        <AuditoryPathway />

        <p className="text-xs text-muted-foreground">{t("path.disclaimer")}</p>

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

        <div className="flex flex-wrap gap-3">
          <Link
            to="/test"
            className="rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background"
          >
            {t("path.go.test")}
          </Link>
          <Link
            to="/science"
            className="rounded-md border border-border/70 px-4 py-2.5 text-sm font-medium"
          >
            {t("sci.link.science.label")}
          </Link>
        </div>
      </main>
    </div>
  );
}
