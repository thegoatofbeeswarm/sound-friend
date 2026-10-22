import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/components/ArticlePage";
import { scienceLinks } from "@/lib/science-links";

const TITLE = "Hearing Loss Prevention: Safe Listening and Your Weekly Sound Dose";
const DESC =
  "WHO safe-listening guidance explained: the weekly sound dose model, the 80 dB / 40 hour adult reference, the 75 dB conservative mode, and practical ways to lower exposure.";

export const Route = createFileRoute("/hearing-loss-prevention")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Audiomaxxer` },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://audiomaxxer.app/hearing-loss-prevention" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomaxxer.app/hearing-loss-prevention" }],
  }),
  component: Page,
});

function Page() {
  return (
    <ArticlePage
      kicker="Safe listening"
      title="Hearing loss prevention"
      intro="Noise-related hearing loss builds up quietly over years. The main risk factor, how much sound you take in over a week, is something you can see and change."
      sections={[
        {
          title: "The weekly sound dose",
          body: [
            "WHO safe-listening guidance, developed with the ITU, is built on a weekly sound dose rather than a single loudness limit. Both how loud and how long matter, and they trade off: every 3 dB louder roughly halves the time you can safely spend listening.",
            "The adult reference is 80 decibels for up to 40 hours a week. WHO also describes a more conservative 75 decibel reference mode, which is the sensible target if you listen most days.",
          ],
        },
        {
          title: "Why young listeners are the focus",
          body: [
            "WHO estimates that over a billion people aged 12–35 are at risk of hearing loss from unsafe recreational listening, and that more than 1.5 billion people already live with some degree of hearing loss. Personal audio devices and loud venues are the two dominant sources.",
            "Early damage is easy to miss because it usually starts in the 4–8 kHz range, where the first effect is a harder time following speech in a busy room.",
          ],
        },
        {
          title: "Practical ways to lower your exposure",
          bullets: [
            "Turn the volume down a little, often. Small reductions buy back a lot of safe listening time.",
            "Use noise-isolating or noise-cancelling headphones so you are not raising the volume to beat background noise.",
            "Take quiet breaks: your weekly dose is cumulative, and breaks reduce it.",
            "Wear earplugs at concerts, clubs and events; venue levels are usually far above any safe continuous limit.",
            "Watch your loudest sessions as well as the average. A single very loud hour can dominate a week.",
          ],
        },
        {
          title: "How Audiomaxxer frames listening risk",
          body: [
            "We describe your listening behaviour (estimated exposure, loudest sessions, weekly trend) and don't claim a personal medical exposure limit derived from your hearing thresholds. There is no established way to turn a screening threshold into an individual safe-volume number.",
            "Estimated levels are directional: they depend on your device, headphones and volume setting, so treat them as a trend to manage rather than a measurement.",
          ],
        },
      ]}
      related={[scienceLinks.audiogram, scienceLinks.howTestsWork, scienceLinks.headphones, scienceLinks.science]}
    />
  );
}
