import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/components/ArticlePage";
import { scienceLinks } from "@/lib/science-links";

const TITLE = "Bayesian Adaptive Hearing Testing: The Algorithm Behind a 4-Minute Screening";
const DESC =
  "How Bayesian adaptive threshold estimation works, and the exact parameters Audiomaxxer runs with: frequencies, tone duration, prior, likelihood, stopping criterion and lapse rates.";

export const Route = createFileRoute("/bayesian-hearing-test")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Audiomaxxer` },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://audiomaxxer.app/bayesian-hearing-test" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomaxxer.app/bayesian-hearing-test" }],
  }),
  component: Page,
});

function Page() {
  return (
    <ArticlePage
      kicker="Methods"
      title="Bayesian adaptive hearing testing"
      intro="Instead of sweeping every level, an adaptive test asks the most informative question next. These are the exact parameters our screening runs with, so the method can be judged rather than taken on trust."
      sections={[
        {
          title: "Why adaptive rather than fixed",
          body: [
            "A traditional pure-tone audiogram plays fixed tones and moves the level up and down until the person no longer responds. It works, but it spends many trials on levels that were never in question, which is why a full clinical sweep takes time.",
            "Audiomaxxer keeps a probability distribution over your threshold at each frequency and ear, updates it after every response, and presents the next tone where uncertainty is greatest. The approach follows the Bayesian adaptive tradition of QUEST (Watson & Pelli, 1983) and Kontsevich & Tyler (1999).",
            "The psychometric model includes small rates of false-positive and missed responses, so a single stray press does not distort the estimate. Tracks stop when the estimate is stable rather than after a fixed count — which is how a full ten-track screening fits into roughly four minutes.",
          ],
        },
        {
          title: "Implementation details",
          definitions: [
            {
              term: "Frequencies tested",
              value:
                "500, 1000, 2000, 4000 and 8000 Hz, each ear separately — ten tracks per screening. Stimuli are pure sine tones. We do not currently test 250 Hz or 6 kHz.",
            },
            {
              term: "Tone duration",
              value:
                "900 milliseconds per tone with 50 millisecond raised fades in and out to avoid audible clicks, followed by a short response window.",
            },
            {
              term: "Catch trials",
              value:
                "There are no silent catch trials today. Instead the psychometric model carries a fixed 2% false-positive rate and a 3% lapse rate, which absorbs stray or missed presses. The trade-off is that the screening cannot detect deliberately random responding; silent catch trials are planned.",
            },
            {
              term: "Bayesian prior",
              value:
                "A Gaussian prior on a −10 to 90 dB grid at 2 dB resolution, SD 22 dB, centred at 10 dB for 500–2000 Hz and 20 dB for 4000 and 8000 Hz, reflecting that noise-related loss appears first in the high frequencies. The likelihood is a logistic function with slope 0.25 per dB.",
            },
            {
              term: "Stopping criterion",
              value:
                "A track completes once it has at least three trials and its posterior SD falls below 4.5 dB. The screening ends when every track has completed or after 44 trials in total, whichever comes first.",
            },
            {
              term: "Confidence value",
              value:
                "Reported confidence describes posterior precision, not headphone accuracy. 100% corresponds to roughly 3 dB of remaining uncertainty; near 0% the uncertainty widens to about 23 dB.",
            },
            {
              term: "Environmental-noise rejection",
              value:
                "Ambient level is estimated with the device microphone before and during screening: up to ~35 dB is excellent, up to ~45 dB acceptable, 45–55 dB degrades quality, and above ~55 dB quiet-tone results are not trustworthy. Noisy tests are still recorded, but flagged.",
            },
            {
              term: "Units",
              value:
                "Levels are relative, estimated values on a clinic-like scale — not measured dB SPL and not clinical dB HL. Compare them with your own previous screenings on the same device and volume setting.",
            },
          ],
        },
        {
          title: "What the algorithm cannot fix",
          body: [
            "Adaptive estimation makes the most of each response, but it cannot recover information that was never there. A noisy room, an uncalibrated headphone, an unknown system volume or an inattentive listener all limit accuracy regardless of how efficient the estimator is.",
          ],
        },
      ]}
      related={[scienceLinks.thresholds, scienceLinks.howTestsWork, scienceLinks.headphones, scienceLinks.science]}
    />
  );
}
