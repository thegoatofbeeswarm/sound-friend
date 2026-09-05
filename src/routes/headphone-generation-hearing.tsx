import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/components/ArticlePage";
import { scienceLinks } from "@/lib/science-links";

const TITLE = "The Headphone Generation: Hearing Risk for Teens and Young Adults";
const DESC =
  "Hours of daily headphone use, concerts and gaming add up. What the WHO estimates about young listeners, which changes appear first, and what actually helps.";

export const Route = createFileRoute("/headphone-generation-hearing")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Audiomaxxer` },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://audiomaxxer.app/headphone-generation-hearing" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomaxxer.app/headphone-generation-hearing" }],
  }),
  component: Page,
});

function Page() {
  return (
    <ArticlePage
      kicker="Young listeners"
      title="The headphone generation"
      intro="If you grew up with earbuds in for several hours a day, your listening history looks nothing like your grandparents' did. The exposure is quieter than a factory floor and lasts far longer — and that combination is exactly what dose-based guidance is about."
      sections={[
        {
          title: "What the numbers say",
          body: [
            "A 2022 systematic review published in BMJ Global Health, summarised by the World Health Organization, estimated that around 24% of young people use personal listening devices at unsafe volumes, and that over one billion young people are potentially at risk of hearing loss from unsafe listening.",
            "Risk estimates are not predictions about any individual. They describe a population, and they exist because sound dose is the one part of the picture people can actually change.",
          ],
        },
        {
          title: "Dose, not just volume",
          body: [
            "Damage risk depends on level and duration together. Roughly, every 3 dB increase in level halves the time you can safely spend at it. Eighty decibels for a full day is a very different exposure from 100 decibels for twenty minutes — but both count towards the same weekly budget.",
            "This is why a single loud concert and a habit of moderately loud commuting both matter, and why 'it doesn't sound that loud' is a poor guide.",
          ],
        },
        {
          title: "What changes first",
          bullets: [
            "High frequencies, typically around 4–8 kHz, before anything in the speech-critical midrange.",
            "Temporary dullness or ringing after a loud event — a warning sign, even when the hearing recovers by morning.",
            "Difficulty in noisy rooms while quiet listening still feels completely fine.",
            "Nothing at all that you notice, which is the usual case early on. Slow change is very hard to detect from the inside.",
          ],
        },
        {
          title: "Why it shows up as 'noisy rooms are hard'",
          body: [
            "Consonants like s, f, th and sh carry much of their energy in the high band. Losing a little sensitivity there rarely makes the world quieter — it makes speech mushier when something else is competing with it. Classrooms, cafeterias, buses and group chats are where it surfaces first.",
          ],
        },
        {
          title: "Habits worth changing now",
          bullets: [
            "Use the 60/60 habit as a starting point: around 60% of maximum volume, and breaks about every 60 minutes.",
            "Prefer noise-isolating headphones. Most volume creep is an attempt to beat background noise, not a desire for loudness.",
            "Turn on your phone's headphone-level warnings and check the weekly exposure figure it reports.",
            "Carry cheap filtered earplugs for concerts, clubs and loud sports. They cut level without wrecking sound quality.",
            "Screen yourself regularly and keep the results, so you have your own history rather than a single snapshot years from now.",
          ],
        },
        {
          title: "The honest limits",
          body: [
            "Noise-related change is generally permanent, so prevention outranks everything else here. A browser screening can flag a pattern worth watching and track it over time; it cannot confirm damage or replace an audiologist's assessment.",
          ],
        },
      ]}
      related={[scienceLinks.prevention, scienceLinks.speechInNoise, scienceLinks.audiogram, scienceLinks.science]}
    />
  );
}
