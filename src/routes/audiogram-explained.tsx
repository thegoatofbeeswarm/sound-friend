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
      intro="An audiogram packs a lot into a small chart. Pitch runs along the bottom, the quietest sound you can detect runs up the side, and each ear gets its own curve."
      sections={[
        {
          title: "The two axes",
          body: [
            "The horizontal axis is frequency, which you hear as pitch. Low tones sit on the left. Audiomaxxer screens 500, 1000, 2000, 4000 and 8000 Hz, which covers most of the range speech uses plus the high band where noise damage tends to show up first.",
            "The vertical axis is level: how loud a tone had to be before you responded. A lower number is better. It means a quieter tone was still audible, and that's why clinical audiograms put the lowest numbers at the top.",
          ],
        },
        {
          title: "One curve per ear",
          body: [
            "Each ear is measured on its own, so you get two curves. Small left–right differences are common and normal. What's worth noticing is a gap that keeps showing up at the same frequencies across several screenings, because a one-off difference can easily come from how the headphones sat or from a moment when you weren't paying attention.",
          ],
        },
        {
          title: "Common shapes",
          bullets: [
            "Flat and low across all frequencies: even sensitivity, nothing standing out.",
            "A dip at 4–8 kHz with normal low frequencies: the classic pattern associated with recreational noise exposure, and the earliest change most people miss.",
            "Reduced across the low frequencies only: often affected by room noise during the test, so re-screen somewhere quiet before reading anything into it.",
            "Jagged, inconsistent curves: usually a sign of a low-quality screening, from a noisy room, too few trials, or uncertain responses.",
          ],
        },
        {
          title: "Why high frequencies matter for speech",
          body: [
            "Consonants like s, f, th and sh carry much of their energy above 4 kHz. Lose sensitivity there and speech in a busy room gets harder to pick apart long before the world sounds any quieter. That's why people tend to notice it in cafés and classrooms first.",
          ],
        },
        {
          title: "Comparing screenings over time",
          body: [
            "The most useful thing you can do with an audiogram from a consumer app is compare it with your own earlier ones, taken with the same headphones, the same volume setting and a similarly quiet room. Keep the setup fixed. A trend across repeated screenings is far more trustworthy than any single number.",
          ],
        },
      ]}
      related={[scienceLinks.thresholds, scienceLinks.howTestsWork, scienceLinks.prevention, scienceLinks.science]}
    />
  );
}
