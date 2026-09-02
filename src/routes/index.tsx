import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Brain, ExternalLink, Globe2, Headphones, MessagesSquare, ShieldCheck, Volume2, Waves } from "lucide-react";
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Audible - Personalized Hearing Screening & Safe Listening" },
      {
        name: "description",
        content:
          "Take a fast adaptive hearing test in your browser, get a personal audiogram, and receive listening limits tuned to your own ears instead of a generic 85 dB rule.",
      },
      { property: "og:title", content: "Audible - Personalized Hearing Screening" },
      {
        property: "og:description",
        content:
          "Adaptive Bayesian hearing screening and personalized safe-listening limits, free in any browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const pillars = [
  {
    icon: Brain,
    title: "Adaptive",
    body: "A Bayesian staircase updates its belief after every response.",
  },
  {
    icon: Volume2,
    title: "Your preferences matter",
    body: "This app is custom-tailored to your needs and preferences",
  },
  {
    icon: Activity,
    title: "Environmental awareness",
    body: "The microphone estimates room noise so a screening is only trusted when the space is quiet enough.",
  },
  {
    icon: Globe2,
    title: "Accessibility",
    body: "Runs on any phone with headphones",
  },
  {
    icon: MessagesSquare,
    title: "AI coach",
    body: "AI conversations to help you understand your current problems",
  },
  {
    icon: Headphones,
    title: "Closed-loop training",
    body: "Custom hearing training based off of real life sounds to stimulate and train your hearing",
  },
];

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
  return (
    <div className="min-h-screen">
      <SiteNav />

      <section className="hero-surface border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <Waves className="h-3.5 w-3.5 text-signal" /> Adaptive audiology for everyone
          </span>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.05] md:text-6xl">
             Protect your hearing.{"\u00a0"}
             <span className="signal-text">Spread the awareness.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
             Studies show that 12~17% of teens are affected by hearing-related problems. To raise awareness of screening and train your hearing, use Audible, the world's first closed-loop training system.{"\u00a0"}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/test">Start a screening</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/history">See saved results</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
             Headphones required. This is not a medical diagnosis. For more accuracy, do a hearing screening at your local clinic/booth.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-3xl font-semibold">What's different about this?</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {pillars.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card"
            >
              <p.icon className="h-5 w-5 text-signal" />
              <h3 className="mt-4 text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
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
                  people live with hearing loss worldwide
                  <ExternalLink className="h-3.5 w-3.5" />
                </p>
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Hearing loss in adolescents: current research</DialogTitle>
                <DialogDescription>
                  A short reading list on why teenage and young-adult hearing is the fastest-growing
                  part of that 1.5 billion.
                </DialogDescription>
              </DialogHeader>
              <ul className="space-y-4">
                {adolescentStudies.map((s) => (
                  <li key={s.url} className="rounded-xl border border-border/70 bg-card/60 p-4">
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
            ["10", "frequency-and-ear tracks measured per screening"],
            ["~4 min", "typical adaptive screening time"],
          ].map(([stat, label]) => (
            <div key={label}>
              <p className="font-display text-4xl font-semibold text-signal">{stat}</p>
              <p className="mt-2 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>


      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-8 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          Results stay in your private account. Screening only - see a clinician for diagnosis.
        </div>
      </footer>
    </div>
  );
}
