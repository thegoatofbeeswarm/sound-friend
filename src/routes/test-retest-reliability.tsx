import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/components/ArticlePage";
import { scienceLinks } from "@/lib/science-links";

const TITLE = "Test-Retest Reliability: Why One Screening Isn't Enough";
const DESC =
  "Every measurement has spread. What test-retest reliability means, how catch trials and a quality score work, and how to tell a real change from noise.";

export const Route = createFileRoute("/test-retest-reliability")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Audiomaxxer` },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://audiomaxxer.app/test-retest-reliability" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomaxxer.app/test-retest-reliability" }],
  }),
  component: Page,
});

function Page() {
  return (
    <ArticlePage
      kicker="Measurement quality"
      title="Test-retest reliability"
      intro="Take the same screening twice in an hour and the two results will not match exactly. That is not a bug — it is what measurement looks like. The useful question is how big the ordinary spread is, so you know when a change means something."
      sections={[
        {
          title: "Precision is not accuracy",
          definitions: [
            {
              term: "Precision (reliability)",
              value:
                "How close repeated measurements of the same thing land to each other. You can check this yourself by repeating a screening under identical conditions.",
            },
            {
              term: "Accuracy (validity)",
              value:
                "How close a measurement is to the true value from a calibrated clinical setup. This cannot be checked from inside the app — it needs a comparison against clinical results.",
            },
          ],
        },
        {
          title: "Where the spread comes from",
          bullets: [
            "You: attention, tiredness, how willing you are to respond to a tone you are only half sure about.",
            "The room: background noise raises the level at which a quiet tone becomes detectable.",
            "The hardware: headphone fit and position shift, and different models deliver different levels for the same setting.",
            "The software stack: browser and operating-system volume paths are not calibrated to a physical reference.",
          ],
        },
        {
          title: "Catch trials and the quality score",
          body: [
            "Some trials in an Audiomaxxer screening are silent. If you report hearing a tone that was never played, that is a false alarm, and enough of them mean the result reflects guessing rather than detection.",
            "Those catch trials feed a screening-quality score alongside response consistency and estimate stability. A low-quality run is worth repeating rather than interpreting — and it is far better to know that than to build a trend out of unreliable points.",
          ],
        },
        {
          title: "Estimate stability vs test conditions",
          body: [
            "Estimate stability describes how tightly the adaptive algorithm has narrowed in on your threshold given the answers you gave. It is a statement about the maths, not about the room.",
            "Test conditions are reported separately: headphones, volume setting, and how quiet your surroundings were. A very stable estimate collected in a noisy kitchen is still a poor measurement, and keeping the two figures apart stops one from disguising the other.",
          ],
        },
        {
          title: "Reading a change over time",
          bullets: [
            "Compare runs with matching conditions: same headphones, same volume setting, similarly quiet room.",
            "Treat a shift smaller than your own typical run-to-run spread as noise.",
            "Prefer trends over three or more sittings to any two-point comparison.",
            "Research mode locks a protocol so repeat runs are genuinely comparable — that is what makes the spread meaningful.",
          ],
        },
      ]}
      related={[scienceLinks.headphones, scienceLinks.bayesian, scienceLinks.thresholds, scienceLinks.science]}
    />
  );
}
