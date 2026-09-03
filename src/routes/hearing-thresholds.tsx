import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/components/ArticlePage";
import { scienceLinks } from "@/lib/science-links";

const TITLE = "Hearing Thresholds and Decibels: What the Numbers Mean";
const DESC =
  "A hearing threshold is the quietest tone you can reliably detect. Here is what the decibel numbers mean, what our confidence value describes, and which units we report.";

export const Route = createFileRoute("/hearing-thresholds")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Audiomaxxer` },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://audiomaxxer.app/hearing-thresholds" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomaxxer.app/hearing-thresholds" }],
  }),
  component: Page,
});

function Page() {
  return (
    <ArticlePage
      kicker="Reading results"
      title="Hearing thresholds and decibels"
      intro="Every number on your profile is a threshold: the quietest level at which a tone of that pitch is still detectable in that ear."
      sections={[
        {
          title: "What a threshold actually is",
          body: [
            "Detection is not a hard cutoff. As a tone gets quieter, the probability that you notice it falls smoothly rather than dropping from certain to impossible. A threshold is a point on that curve — conventionally the level where detection becomes reliable — estimated from the pattern of your responses rather than read off a single trial.",
            "That is why a screening presents several tones near the edge of audibility instead of asking you once. It is also why a single missed press does not move a well-estimated threshold much.",
          ],
        },
        {
          title: "Lower numbers are better",
          body: [
            "Thresholds are reported in decibels, and on this scale a smaller number means you detected a quieter sound. A threshold of 5 dB at 4 kHz is better than 25 dB at the same frequency. Differences of a few decibels between screenings are ordinary measurement variation; consistent shifts of 10 dB or more in the same direction are worth paying attention to.",
          ],
        },
        {
          title: "What the confidence value means",
          body: [
            "The confidence percentage next to a threshold is not a statement about your headphones — it describes how precisely we pinned down that number from your responses. Near 100% the remaining uncertainty is small, around 3 dB. As it falls towards 0% the uncertainty widens, up to roughly 23 dB. A low-confidence threshold is a rough indication, not a measurement.",
            "Confidence rises with more trials on that track and falls when your responses near the threshold are inconsistent.",
          ],
        },
        {
          title: "Units: relative and estimated, not clinical dB HL",
          body: [
            "The levels we report are estimates on a scale similar to the ones used in clinics, but they are not the same thing. The actual sound pressure reaching your eardrum depends on your headphones, your operating-system and browser volume, and your browser's audio processing — none of which the app can measure.",
            "Room noise readings are likewise estimates from a phone or laptop microphone, not calibrated sound-level measurements. Use our numbers to compare against your own previous tests on the same device with the same volume settings, rather than as absolute dB SPL or clinical dB HL values.",
          ],
        },
        {
          title: "How to make your thresholds more trustworthy",
          bullets: [
            "Test in a quiet room, with the microphone check reporting a low ambient level.",
            "Use the same headphones and the same system volume every time.",
            "Choose a calibrated headphone model where possible so a correction is applied.",
            "Complete the whole screening rather than stopping early — fewer trials means wider uncertainty.",
            "Re-test when rested; fatigue and inattention widen the spread of responses.",
          ],
        },
      ]}
      related={[scienceLinks.audiogram, scienceLinks.bayesian, scienceLinks.headphones, scienceLinks.science]}
    />
  );
}
