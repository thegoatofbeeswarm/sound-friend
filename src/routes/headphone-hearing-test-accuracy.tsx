import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/components/ArticlePage";
import { scienceLinks } from "@/lib/science-links";

const TITLE = "Headphone Accuracy in Online Hearing Tests";
const DESC =
  "Which headphone models Audiomaxxer applies a correction for, how large those corrections are, how they were derived, and what uncalibrated headphones mean for your results.";

export const Route = createFileRoute("/headphone-hearing-test-accuracy")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Audiomaxxer` },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://audiomaxxer.app/headphone-hearing-test-accuracy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomaxxer.app/headphone-hearing-test-accuracy" }],
  }),
  component: Page,
});

function Page() {
  return (
    <ArticlePage
      kicker="Calibration"
      title="Headphone accuracy in hearing tests"
      intro="Two people can run the same screening at the same system volume and hear meaningfully different sound levels, purely because of their headphones. This is the biggest accuracy limit in any consumer hearing test — including ours."
      sections={[
        {
          title: "Why headphones change the result",
          body: [
            "Headphones differ in sensitivity and in how they couple to the ear. A sealed in-ear tip delivers noticeably more level at the eardrum than an open-fit earbud driven by the same signal, and frequency response varies between models on top of that.",
            "Without a correction, that difference lands directly in your thresholds: the same ears can look several decibels better or worse depending only on what is on your head.",
          ],
        },
        {
          title: "Models with a correction",
          definitions: [
            { term: "AirPods Pro 3", value: "+6 dB correction applied." },
            { term: "AirPods Pro 2", value: "+6 dB correction applied." },
            { term: "AirPods (open fit)", value: "+3 dB correction applied." },
            { term: "Wired EarPods", value: "+2 dB correction applied." },
            { term: "Sony WH-1000XM6", value: "+1 dB correction applied." },
            { term: "Bose QuietComfort Ultra", value: "+1 dB correction applied." },
            {
              term: "Generic types (over-ear, on-ear, in-ear)",
              value:
                "Rough type-level offsets only — for example about +6 dB for in-ear and +2 dB for on-ear. These are not calibrated for a specific model, so the real offset may differ.",
            },
          ],
        },
        {
          title: "How the corrections were obtained",
          body: [
            "They are approximate offsets based on published third-party measurements of how these headphones respond, not on our own coupler or artificial-ear measurements. Fit style matters a great deal — an in-canal seal reads louder than an open earbud — and individual fit varies from person to person.",
            "We state this plainly because it would be easy to imply a level of calibration we do not have. Treat the corrections as accurate to roughly ±5 dB, and even that is not a guarantee.",
          ],
        },
        {
          title: "Using uncalibrated headphones",
          body: [
            "If your model is not in the list, the screening still works and is still useful. Absolute thresholds may be off by several decibels, but relative tracking — comparing today's screening with your own earlier ones on the same hardware — remains informative, because the unknown offset is roughly constant across your sessions.",
            "The one thing to avoid is switching headphones or system volume between screenings and then reading meaning into the change.",
          ],
        },
        {
          title: "The other limits that stack on top",
          bullets: [
            "Browser and operating-system volume are not readable by the app, so absolute loudness depends on your setup.",
            "Phone and laptop microphones estimate room noise rather than measuring it precisely.",
            "Attention, tiredness and response style affect any behavioural hearing test.",
            "Audiomaxxer is a screening and training tool, not a diagnostic device — see an audiologist for a clinical assessment.",
          ],
        },
      ]}
      related={[scienceLinks.thresholds, scienceLinks.howTestsWork, scienceLinks.bayesian, scienceLinks.science]}
    />
  );
}
