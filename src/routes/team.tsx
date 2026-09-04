import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Mail, Users } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team | Audiomaxxer hearing test and training" },
      {
        name: "description",
        content:
          "Meet the Audiomaxxer team behind the hearing screening and training app, and get in touch with questions or bug reports.",
      },
      { property: "og:title", content: "Team | Audiomaxxer hearing test and training" },
      {
        property: "og:description",
        content:
          "Meet the Audiomaxxer team and contact us at audiomaxxer@gmail.com with questions or feedback.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamPage,
});

const EMAIL = "audiomaxxer@gmail.com";
const INSTAGRAM = "https://www.instagram.com/audiomaxxer/";

const MEMBERS = [
  { name: "Andrew Huang", roleKey: "team.role.founder", bioKey: "team.bio.andrew", initials: "AH" },
  { name: "Julius Ohlweiler", roleKey: "team.role.tester", bioKey: "team.bio.julius", initials: "JO" },
  { name: "Brandon Sung", roleKey: "team.role.social", bioKey: "team.bio.brandon", initials: "BS" },
];

function TeamPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-5 py-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-signal" /> {t("team.badge")}
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("team.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("team.lead")}</p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MEMBERS.map((m) => (
            <article
              key={m.name}
              className="rounded-2xl border border-border/70 bg-card/60 p-6 transition-colors hover:border-signal/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/15 font-display text-sm font-semibold text-signal">
                {m.initials}
              </div>
              <h2 className="mt-4 text-lg font-semibold">{m.name}</h2>
              <p className="text-sm text-signal">{t(m.roleKey)}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(m.bioKey)}</p>
            </article>
          ))}
        </div>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card/60 p-6">
            <h2 className="text-lg font-semibold">{t("team.contact.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("team.contact.body")}{" "}
              <a className="text-signal underline underline-offset-4" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
              .
            </p>
            <Button asChild className="mt-5">
              <a href={`mailto:${EMAIL}`}>
                <Mail className="mr-2 h-4 w-4" /> {t("team.contact.cta")}
              </a>
            </Button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-6">
            <h2 className="text-lg font-semibold">{t("team.social.title")}</h2>
            <Button asChild variant="secondary" className="mt-5">
              <a href={INSTAGRAM} target="_blank" rel="noreferrer noopener">
                <Instagram className="mr-2 h-4 w-4" /> {t("team.social.instagram")}
              </a>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
