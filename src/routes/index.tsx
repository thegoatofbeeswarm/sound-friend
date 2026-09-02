import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Brain, Globe2, ShieldCheck, Volume2, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    title: "Limits tuned to you",
    body: "Early damage and frequency-specific sensitivity shift your ceiling below the generic 85 dB flag.",
  },
  {
    icon: Activity,
    title: "Environmental awareness",
    body: "The microphone estimates room noise so a screening is only trusted when the space is quiet enough.",
  },
  {
    icon: Globe2,
    title: "Accessibility",
    body: "Runs on any phone with headphones, so routine screening reaches communities far from real-life audiology equipment.",
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
        <h2 className="text-3xl font-semibold">How it works differently</h2>
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
          {[
            ["1.5B", "people live with hearing loss worldwide"],
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
