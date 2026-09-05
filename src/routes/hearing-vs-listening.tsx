import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/components/ArticlePage";
import { scienceLinks } from "@/lib/science-links";

const TITLE = "Hearing vs Listening: Why a Normal Test Can Still Feel Hard";
const DESC =
  "Hearing is detection; listening is what your brain does with the sound. Why people with normal audiograms still struggle in noisy rooms, and what a listening profile adds.";

export const Route = createFileRoute("/hearing-vs-listening")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Audiomaxxer` },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://audiomaxxer.app/hearing-vs-listening" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomaxxer.app/hearing-vs-listening" }],
  }),
  component: Page,
});

function Page() {
  return (
    <ArticlePage
      kicker="Concepts"
      title="Hearing vs listening"
      intro="Hearing is whether a sound reaches you. Listening is what you manage to do with it. Most everyday difficulty lives in the second one, which is why a clean tone test can sit alongside a genuinely hard classroom."
      sections={[
        {
          title: "Two different questions",
          definitions: [
            {
              term: "Hearing",
              value:
                "Detection sensitivity: the quietest tone you can notice at each frequency. This is what an audiogram measures, and what a browser screening estimates.",
            },
            {
              term: "Listening",
              value:
                "Everything after detection: separating a voice from competing sound, following it over time, locating where it came from, and reconstructing the words that noise partly covered.",
            },
          ],
        },
        {
          title: "Why the two can disagree",
          body: [
            "Detection is measured in silence with a single, predictable sound. Real conversation is the opposite: several sound sources at once, unpredictable timing, and a listener who has to decide moment by moment what to attend to.",
            "So a person can detect very quiet tones and still lose the thread in a busy room. Attention, working memory, the acoustics of the room and the health of the fine timing information the ear sends onwards all contribute — and none of them appear on an audiogram.",
          ],
        },
        {
          title: "The five dimensions Audiomaxxer profiles",
          bullets: [
            "Frequency sensitivity — the classic detection measure, ear by ear.",
            "Speech in noise — how much competing sound you can tolerate and still understand words.",
            "Frequency discrimination — how small a pitch difference you can reliably tell apart.",
            "Sound localisation — how well you place a sound in space, which depends on comparing the two ears.",
            "Temporal and pattern processing — following rapid speech and short gaps, where timing rather than loudness is the limit.",
          ],
        },
        {
          title: "Why the distinction changes what you do",
          body: [
            "If the problem is detection, the answers are protection, medical assessment, and where appropriate amplification. If the problem is listening, the answers include practice, strategy, and changing the situation — sitting closer, facing the speaker, cutting the background where you can.",
            "A profile that separates the two tells you which conversation to have, instead of leaving you with one number that fits everything and explains nothing.",
          ],
        },
        {
          title: "What this app is not",
          body: [
            "Audiomaxxer is a screening and training tool. It cannot diagnose a hearing disorder, rule one out, or distinguish medical causes. If listening is hard for you in ordinary situations — regardless of what any app says — that is a reason to see an audiologist.",
          ],
        },
      ]}
      related={[scienceLinks.speechInNoise, scienceLinks.audiogram, scienceLinks.reliability, scienceLinks.science]}
    />
  );
}
