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
      intro="Hearing is whether a sound reaches you. Listening is what you manage to do with it. Most everyday difficulty lives in the second. That's why a clean tone test can sit alongside a hard time in class."
      sections={[
        {
          title: "Two different questions",
          definitions: [
            {
              term: "Hearing",
              value:
                "Detection sensitivity: the quietest tone you can notice at each frequency. An audiogram measures this. A browser screening estimates it.",
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
            "Detection is measured in silence, with one predictable sound. Conversation is the opposite. Several sources talk at once, the timing is unpredictable, and the listener has to keep deciding, moment by moment, what to attend to.",
            "So a person can detect very quiet tones and still lose the thread in a busy room. Attention, working memory, the acoustics of the room and the health of the fine timing information the ear sends onwards all contribute, and none of them appear on an audiogram.",
          ],
        },
        {
          title: "The five dimensions Audiomaxxer profiles",
          bullets: [
            "Frequency sensitivity: the classic detection measure, ear by ear.",
            "Speech in noise: how much competing sound you can tolerate and still understand words.",
            "Frequency discrimination: how small a pitch difference you can reliably tell apart.",
            "Sound localisation: how well you place a sound in space, which depends on comparing the two ears.",
            "Temporal and pattern processing: following rapid speech and short gaps, where timing rather than loudness is the limit.",
          ],
        },
        {
          title: "Why the distinction changes what you do",
          body: [
            "If the problem is detection, the answers are protection, medical assessment, and where appropriate amplification. If the problem is listening, the answers include practice, strategy, and changing the situation: sitting closer, facing the speaker, cutting the background where you can.",
            "A profile that separates the two shows which kind of problem you're dealing with.",
          ],
        },
        {
          title: "What this app is not",
          body: [
            "Audiomaxxer is a screening and training tool. It can't diagnose a hearing disorder, rule one out, or distinguish medical causes. If listening is hard for you in ordinary situations, see an audiologist, whatever any app says.",
          ],
        },
      ]}
      related={[scienceLinks.speechInNoise, scienceLinks.audiogram, scienceLinks.reliability, scienceLinks.science]}
    />
  );
}
