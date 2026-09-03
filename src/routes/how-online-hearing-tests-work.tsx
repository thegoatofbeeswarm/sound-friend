import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/components/ArticlePage";
import { scienceLinks } from "@/lib/science-links";

const TITLE = "How Online Hearing Tests Work (And What They Can Measure)";
const DESC =
  "A step-by-step explanation of browser-based hearing screening: pure-tone tracks, adaptive levels, room noise checks, headphone calibration and honest accuracy limits.";

export const Route = createFileRoute("/how-online-hearing-tests-work")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Audiomaxxer` },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://audiomaxxer.app/how-online-hearing-tests-work" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomaxxer.app/how-online-hearing-tests-work" }],
  }),
  component: Page,
});

function Page() {
  return (
    <ArticlePage
      kicker="Methods"
      title="How online hearing tests work"
      intro="An online screening plays quiet tones and watches which ones you respond to. Here is what happens in each stage, and where the honest limits of a browser test sit."
      sections={[
        {
          title: "Step 1 — Setting the room and the headphones",
          body: [
            "Before any tone is played, two things decide whether the result will mean anything: how quiet the room is, and what you are listening through. Background noise raises the level at which a tone becomes audible, so a screening taken in a noisy room reports thresholds that look worse than your real ones — especially at low frequencies, where room noise is loudest.",
            "Audiomaxxer uses the microphone to estimate the background level before and during the screening, and headphone choice applies a model-specific correction where we have one. Both are recorded with the result so a noisy or uncalibrated test is labelled rather than silently trusted.",
          ],
        },
        {
          title: "Step 2 — Playing tones one ear at a time",
          body: [
            "Each ear is tested separately with pure sine tones at 500, 1000, 2000, 4000 and 8000 Hz — ten tracks in total. Each tone lasts 900 milliseconds with 50 millisecond fades so there is no click at the start or end, followed by a short response window.",
            "You simply indicate whether you heard the tone. There is no right answer to guess: the informative moments are the ones near the edge of audibility.",
          ],
        },
        {
          title: "Step 3 — Choosing the next level adaptively",
          body: [
            "A traditional audiogram sweeps levels up and down over a wide range, spending a lot of trials on sounds that were never in doubt. Audiomaxxer instead keeps a probability distribution over your threshold at each frequency and ear, updates it after every response, and presents the next tone where uncertainty is highest.",
            "Because the algorithm also models occasional stray or missed presses, one mistake does not swing the estimate. A track finishes when the estimate is stable rather than after a fixed number of tones.",
          ],
        },
        {
          title: "Step 4 — Reading the result",
          body: [
            "The output is an estimated threshold for each ear at each frequency plus a confidence value describing how precise that estimate is, typically in about four minutes. Results are plotted as an audiogram-style curve per ear and stored so you can compare later screenings against the same baseline.",
          ],
        },
        {
          title: "What an online test cannot do",
          bullets: [
            "It is a screening, not a diagnosis. It cannot identify the cause of a hearing difficulty, assess tinnitus, or detect middle-ear problems.",
            "Browser and operating-system volume are not readable by the app, so absolute loudness depends on your own setup.",
            "Phone and laptop microphones estimate room noise; they are not calibrated sound level meters.",
            "Attention, tiredness and response style all affect any behavioural hearing test.",
            "If you are worried about your hearing, see an audiologist for a full clinical assessment.",
          ],
        },
      ]}
      related={[scienceLinks.bayesian, scienceLinks.audiogram, scienceLinks.headphones, scienceLinks.science]}
    />
  );
}
