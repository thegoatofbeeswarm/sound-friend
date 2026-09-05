import { createFileRoute } from "@tanstack/react-router";
import { ArticlePage } from "@/components/ArticlePage";
import { scienceLinks } from "@/lib/science-links";

const TITLE = "Speech in Noise: The Listening Test That Matches Real Life";
const DESC =
  "Why understanding speech in a noisy room is a better measure of everyday listening than a quiet-room tone test, and how a digits-in-noise screening works.";

export const Route = createFileRoute("/speech-in-noise-test")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Audiomaxxer` },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://audiomaxxer.app/speech-in-noise-test" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomaxxer.app/speech-in-noise-test" }],
  }),
  component: Page,
});

function Page() {
  return (
    <ArticlePage
      kicker="Listening skills"
      title="Speech in noise"
      intro="Almost nobody complains that the world is too quiet. People complain that they cannot follow a conversation in a café, a classroom or a party. That is a speech-in-noise problem, and a quiet-room tone test barely touches it."
      sections={[
        {
          title: "What the test measures",
          body: [
            "A speech-in-noise screening plays speech material — in Audiomaxxer, spoken digit triplets — inside a steady background of noise, and adapts the balance between the two after every answer. Get it right and the noise gets louder; get it wrong and the speech is given more room.",
            "After enough trials the level settles around the point where you get roughly half of the items correct. That balance point is called the speech reception threshold in noise, and it is usually reported as a signal-to-noise ratio in decibels. A lower ratio means you can still follow speech when the noise is closer to drowning it out.",
          ],
        },
        {
          title: "Why tones are not enough",
          body: [
            "Pure-tone thresholds tell you how faint a sound can be before it disappears. Understanding speech in noise adds several other jobs on top: separating one voice from competing sound, tracking it over time, filling in the syllables that got masked, and holding the sentence in memory while the next one arrives.",
            "Two people with near-identical audiograms can perform very differently on the same noise test. This is why a normal tone result and genuine difficulty in a loud room are not a contradiction.",
          ],
        },
        {
          title: "How to read your score",
          bullets: [
            "Audiomaxxer converts your signal-to-noise ratio into a 0–100 listening score, so the direction is intuitive: higher is better.",
            "The score depends on your headphones, your volume setting and your room. Compare like with like — same setup, similar quiet.",
            "A single run has real measurement spread. Two or three runs across different days give a far more honest picture than one.",
            "The score is a screening result, not a diagnosis. Persistent difficulty in everyday conversation is a reason to see an audiologist.",
          ],
        },
        {
          title: "What training can and cannot do",
          body: [
            "Practising with speech in noise reliably makes people better at the task, and there is reasonable evidence of some transfer to related listening situations. What it does not do is repair damage in the inner ear — improvements come from attention, strategy and pattern learning, not from restored sensitivity.",
            "That distinction matters for expectations: training is worth doing, and it is not a cure.",
          ],
        },
        {
          title: "Getting a clean measurement",
          bullets: [
            "Use over-ear or in-ear headphones, not laptop speakers — the noise and speech must arrive together at each ear.",
            "Sit somewhere genuinely quiet; background noise in your room adds to the test noise and depresses your score.",
            "Set the volume once, comfortably, and do not change it mid-test.",
            "Do not test when you are exhausted. Fatigue costs several points on this task.",
          ],
        },
      ]}
      related={[scienceLinks.hearingVsListening, scienceLinks.reliability, scienceLinks.howTestsWork, scienceLinks.science]}
    />
  );
}
