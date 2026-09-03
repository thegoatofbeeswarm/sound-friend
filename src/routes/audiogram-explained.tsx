import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/components/ArticlePage";
import { scienceLinks } from "@/lib/science-links";

const TITLE = "Audiogram Explained: How to Read Your Hearing Chart";
const DESC =
  "What the axes, curves and ear symbols on an audiogram mean, why high-frequency dips appear first, and how to compare one screening with the next.";

export const Route = createFileRoute("/audiogram-explained")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Audiomaxxer` },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://audiomaxxer.app/audiogram-explained" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomaxxer.app/audiogram-explained" }],
  }),
  component: Page,
});

function Page() {
  return (
    <ArticlePage
      kicker="Reading results"
      title="Audiogram explained"
      intro="An audiogram is a small chart with a lot of information in it: pitch across the bottom, quietness you can detect up the side, and one curve per ear."
      sections={[
        {
          title: "The two axes",
          body: [
            "The horizontal axis is frequency — pitch — running from low tones on the left to high tones on the right. Audiomaxxer screens 500, 1000, 2000, 4000 and 8000 Hz, covering the range that carries most of speech plus the high band where noise damage tends to show first.",
            "The vertical axis is level: how loud a tone had to be before you responded. Lower on the chart means a quieter tone was still audible, which is the better result. Clinical audiograms plot this axis downwards for the same reason.",
          ],
        },
        {
          title: "One curve per ear",
          body: [
            "Each ear is measured independently, so you get two curves. Small left–right differences are common and normal. A consistent gap at the same frequencies across several screenings is more interesting than a one-off difference, which can easily come from headphone fit or a moment of inattention.",
          ],
        },
        {
          title: "Common shapes",
          bullets: [
            "Flat and low across all frequencies: even sensitivity, nothing standing out.",
            "A dip at 4–8 kHz with normal low frequencies: the classic pattern associated with recreational noise exposure, and the earliest change most people miss.",
            "Reduced across the low frequencies only: often affected by room noise during the test, so re-screen somewhere quiet before reading anything into it.",
            "Jagged, inconsistent curves: usually a sign of a low-quality screening — noisy room, few trials, or uncertain responses.",
          ],
        },
        {
          title: "Why high frequencies matter for speech",
          body: [
            "Consonants like s, f, th and sh carry much of their energy above 4 kHz. Losing sensitivity there rarely makes the world quieter — it makes speech in a busy room harder to disentangle, which is why people notice it in cafés and classrooms long before they notice it anywhere else.",
          ],
        },
        {
          title: "Comparing screenings over time",
          body: [
            "The single most useful thing you can do with an audiogram from a consumer app is compare it with your own earlier ones, taken with the same headphones, the same volume setting and a similarly quiet room. Trends across repeated screenings are far more trustworthy than any single absolute number.",
          ],
        },
      ]}
      related={[scienceLinks.thresholds, scienceLinks.howTestsWork, scienceLinks.prevention, scienceLinks.science]}
    />
  );
}
