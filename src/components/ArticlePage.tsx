import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";

export type ArticleSection = {
  title: string;
  body?: string[];
  bullets?: string[];
  definitions?: { term: string; value: string }[];
};

export type RelatedLink = { to: string; label: string; blurb: string };

export function ArticlePage({
  kicker,
  title,
  intro,
  sections,
  related,
}: {
  kicker: string;
  title: string;
  intro: string;
  sections: ArticleSection[];
  related?: RelatedLink[];
}) {
  return (
    <div className="min-h-screen">
      <SiteNav />

      <section className="hero-surface border-b border-border/60">
        <div className="mx-auto max-w-4xl px-5 py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 text-signal" /> {kicker}
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground">{intro}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-5 px-5 py-14">
        {sections.map((s) => (
          <article key={s.title} className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
            <h2 className="text-xl font-semibold">{s.title}</h2>
            {s.body?.map((p) => (
              <p key={p.slice(0, 32)} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
            {s.bullets ? (
              <ul className="mt-4 space-y-3">
                {s.bullets.map((b) => (
                  <li key={b.slice(0, 32)} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                    {b}
                  </li>
                ))}
              </ul>
            ) : null}
            {s.definitions ? (
              <dl className="mt-5 space-y-4">
                {s.definitions.map((d) => (
                  <div key={d.term} className="border-t border-border/60 pt-4 first:border-t-0 first:pt-0">
                    <dt className="text-sm font-semibold">{d.term}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </article>
        ))}

        {related?.length ? (
          <article className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
            <h2 className="text-xl font-semibold">Keep reading</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.to}>
                  <Link
                    to={r.to}
                    className="block h-full rounded-xl border border-border/60 bg-background/40 p-4 transition-colors hover:border-signal/60"
                  >
                    <p className="text-sm font-semibold">{r.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.blurb}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </div>
    </div>
  );
}
