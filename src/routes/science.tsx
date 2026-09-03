import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BookOpen, ExternalLink } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { scienceLinks } from "@/lib/science-links";

export const Route = createFileRoute("/science")({
  head: () => ({
    meta: [
      { title: "The Science Behind Audiomaxxer — Methods, Evidence, Limits" },
      {
        name: "description",
        content:
          "How Audiomaxxer estimates hearing thresholds, why adaptive auditory training works, what ambient noise does to a screening, and where our limits are.",
      },
      { property: "og:title", content: "The science behind Audiomaxxer" },
      {
        property: "og:description",
        content:
          "Bayesian threshold estimation, auditory training evidence, safe-listening guidance, and an honest list of limitations.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://audiomaxxer.app/science" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://audiomaxxer.app/science" }],
  }),
  component: SciencePage,
});

const topics = [
  scienceLinks.howTestsWork,
  scienceLinks.bayesian,
  scienceLinks.audiogram,
  scienceLinks.thresholds,
  scienceLinks.headphones,
  scienceLinks.prevention,
];

const sections = [
  {
    title: "Adaptive threshold estimation",
    body: [
      "A traditional hearing test, also known as an audiogram, typically involves playing a series of fixed tones and adjusting the volume up and down until the person being tested can no longer hear them. While this method can be effective, it tends to focus on a wide range of sound levels, many of which don't provide much useful information. As a result, a lot of time is spent on testing sound levels that don't really tell us anything new or important about the person's hearing.",
      "Audiomaxxer uses a different approach to measure hearing thresholds. It keeps track of the probability of your threshold at each frequency and for each ear, and updates this information after every response. The next tone is then presented at the frequency where there is the most uncertainty about your threshold. This method is based on Bayesian principles and is adaptive, meaning it adjusts to your individual responses. The model also takes into account the possibility of occasional incorrect or missed responses, so a single mistake doesn't affect the overall estimate. The test stops when your threshold is stable, rather than after a fixed number of tones. This means that Audiomaxxer can provide a more accurate and efficient measurement of your hearing thresholds.",
      "The outcome is an estimate of the hearing threshold for each ear at different frequencies, along with a measure of how confident we are in that estimate, all of which is determined in about four minutes.",
    ],
  },
  {
    title: "Auditory training",
    body: [
      "Hearing is not only the ear. Understanding speech in a noisy room depends on how the brain separates a target voice from competing sound, and that separation improves with practice — the effect audiologists call auditory or perceptual learning.",
      "Training works best when it is targeted and difficulty-adaptive: exercises should sit just above what you currently manage, and should use the frequency regions and listening situations where your own profile is weakest. Adaptive and task-specific training may improve learning efficiency and transfer, although the magnitude of benefit varies across studies and populations.",
      "This is why our training reads your screening profile rather than offering everyone the same exercise list. Improvements are in listening performance; training does not repair damaged cochlear hair cells.",
    ],
  },
  {
    title: "Environmental noise control",
    body: [
      "Background noise raises the level at which a tone becomes audible, so a screening taken in a noisy room reports thresholds that look worse than your real ones — especially at low frequencies, where room noise is loudest.",
      "Audiomaxxer uses the microphone to check the background noise level before and during a hearing test. If it's too loud, it will flag the test as unreliable. This way, you can be sure that the results are accurate and not affected by outside noise. When you test in a quiet room, you can trust that the results will be consistent over time, giving you a clear picture of any changes in your hearing.",
    ],
  },
  {
    title: "Safe listening",
    body: [
      "The World Health Organization has guidelines to help keep our listening safe. They look at how much sound we're exposed to over a whole week, not just how loud it is at one time. This is called a weekly sound dose. It's like a limit on how much sound we can handle in a week. The WHO says that for adults, it's safe to listen to sounds at 80 decibels for up to 40 hours a week. But they also have a more cautious guideline of 75 decibels. This is to help prevent hearing loss and other problems that can come from listening to loud sounds for too long.",
      "The World Health Organization says a huge number of people, over a billion, between 12 and 35 years old, are in danger of damaging their hearing because of how they listen to music for fun. And sadly, more than 1.5 billion people already have some kind of hearing problem.",
      "Audiomaxxer therefore describes your listening behaviour — estimated exposure, loudest sessions, weekly trend — rather than claiming a personally validated medical exposure limit derived from your thresholds.",
    ],
  },
];

const implementation: { term: string; value: string }[] = [
  {
    term: "Frequencies tested",
    value:
      "We test hearing at different frequencies — 500, 1000, 2000, 4000 and 8000 Hz. Each ear is tested separately, and we use 10 different tracks for each screening. The sounds used are pure sine tones. Currently, we don't test at 250 Hz or 6 kHz.",
  },
  {
    term: "Tone duration",
    value:
      "Each sound is played for 900 milliseconds, with a gradual increase and decrease in volume over 50 milliseconds to prevent any sharp clicks. There's also a brief pause before the time to respond runs out.",
  },
  {
    term: "Catch trials",
    value:
      "Instead of using silent catch trials, the psychometric model has a fixed rate of false positives, which is 2%, and a lapse rate of 3%. This means that if someone accidentally presses a button or misses a press, it won't affect the results as much. The model can absorb these small mistakes. However, this also means that the screening can't detect if someone is responding randomly on purpose. To fix this, silent catch trials will be added later. For now, the model just works with the fixed rates to account for any stray or missed presses. This way, isolated mistakes won't shift the threshold too much.",
  },
  {
    term: "Bayesian prior",
    value:
      "A Gaussian prior on a −10 to 90 dB grid at 2 dB resolution, SD 22 dB, centred at 10 dB for 500–2000 Hz and 20 dB for 4000 and 8000 Hz, reflecting that noise-related loss appears first in the high frequencies. The likelihood is a logistic function with slope 0.25 per dB.",
  },
  {
    term: "Stopping criterion",
    value:
      "So, here's how it works: a track is considered complete when two things happen — it's been tried at least three times, and the difference in results, or posterior SD, gets below a certain threshold, 4.5 dB. The whole screening process wraps up when all tracks have finished or when we've done a total of 44 trials, whichever happens first.",
  },
  {
    term: "What the confidence value means",
    value:
      "This isn't about how accurate your headphones are, but rather how sure we are about the results. Think of it like a confidence score — 100% means we're very confident, with a small margin of error, around 3 dB. As we get closer to 0%, our confidence drops, and the margin of error increases, up to about 23 dB. It's like a measure of how precise our measurement is, based on your responses.",
  },
  {
    term: "Headphone models with a correction",
    value:
      "Here's how different headphones affect sound levels: the AirPods Pro 3 and Pro 2 make sounds 6 decibels louder, while the open-fit AirPods make them 3 decibels louder. Wired EarPods make sounds 2 decibels louder, and the Sony WH-1000XM6 and Bose QuietComfort Ultra make them 1 decibel louder. Other types of headphones, like over-ear, on-ear, and in-ear, have different effects on sound levels too — for example, in-ear headphones can make sounds 6 decibels louder, and on-ear headphones can make them 2 decibels louder. However, these types of headphones aren't calibrated in the app, so the exact effects might vary.",
  },
  {
    term: "How those corrections were obtained",
    value:
      "They are rough estimates of how sound levels change, based on what other people have measured about how different headphones respond to sound. These estimates aren't super precise, and they're not based on our own tests using a fake ear to measure sound. Also, the type of headphones you use can make a big difference — for example, headphones that fit inside your ear canal can make sounds seem louder than headphones that sit outside your ear. We're being upfront about how rough these estimates are, because we don't want to make it seem like we have a more precise system for measuring sound than we actually do. Think of these estimates as being accurate to within about 5 decibels, give or take — and even that's not a hard and fast rule.",
  },
  {
    term: "Environmental-noise rejection criterion",
    value:
      "When we're getting ready to do a screening, we first check how loud the room is using the device's microphone. If it's really quiet, like up to 35 decibels, that's great. If it's a bit louder, up to 45 decibels, that's still okay. But if it gets too loud, between 45 and 55 decibels, the quality of the screening might not be as good. And if it's even louder, above 55 decibels, we might not be able to trust the results, especially when it comes to quiet sounds. The good thing is that we don't just throw away the results if it's too loud — we still record them and make a note that they might not be accurate, so we can take that into account later on.",
  },
  {
    term: "Units",
    value:
      "The sound levels we're talking about are not absolute — they're more like estimates. We use a special scale that's similar to the ones used in clinics, but it's not exactly the same. The actual sound level you hear depends on a few things: your headphones, the volume on your computer, and how the sound is processed by your browser. Unfortunately, we can't measure these things. When we look at the background noise in your room, we get an estimate of the sound level, but this isn't a precise measurement either. The best way to use our sound levels is to compare them to your own previous tests, done on the same device and with the same volume settings. This will give you a better idea of how your hearing is doing over time.",
  },
];

const limitations = [
  "The volume on your browser and operating system isn't something the app can detect, so the actual loudness you hear depends on how you've set up your device.",
  "Headphones can have really different sound profiles. To get accurate sound, we make adjustments for specific models that we support. If you're using a different model, the sound won't be perfectly calibrated, but you can still use it to compare sounds relatively.",
  "Phone and laptop microphones aren't super accurate when it comes to measuring sound levels. They can give you an idea of how loud something is, but the readings are really just estimates.",
  "Things like paying attention, feeling tired, and how someone responds can impact the results of a hearing test that relies on behavior.",
  "Audiomaxxer is a tool that helps check your hearing and can even help train your ears. But it's not a doctor, so it can't tell you if you have hearing loss or other medical problems like tinnitus. It also can't find problems with the middle part of your ear. If you're worried about your hearing, you should go see a special kind of doctor called an audiologist. They can do a thorough check of your hearing and give you a proper diagnosis.",
];


const references = [
  {
    title: "WHO — Over 1 billion young people at risk of hearing loss from unsafe listening practices",
    source: "World Health Organization / BMJ Global Health, 2022",
    url: "https://www.who.int/news/item/15-11-2022-over-1-billion-young-people-at-risk-of-hearing-loss-from-unsafe-listening-practices",
  },
  {
    title: "WHO — Deafness and hearing loss fact sheet (1.5 billion people affected)",
    source: "World Health Organization",
    url: "https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss",
  },
  {
    title: "WHO — Make Listening Safe / global standard for safe listening devices",
    source: "World Health Organization, 2022",
    url: "https://www.who.int/activities/making-listening-safe",
  },
  {
    title: "Kontsevich & Tyler — Bayesian adaptive estimation of psychometric slope and threshold",
    source: "Vision Research, 1999",
    url: "https://pubmed.ncbi.nlm.nih.gov/10493606/",
  },
  {
    title: "Watson & Pelli — QUEST: a Bayesian adaptive psychometric method",
    source: "Perception & Psychophysics, 1983",
    url: "https://pubmed.ncbi.nlm.nih.gov/6844102/",
  },
  {
    title:
      "Ferguson MA & Henshaw H — Auditory training can improve working memory, attention, and communication in adverse conditions for adults with hearing loss",
    source: "Frontiers in Psychology, 2015; 6:556",
    url: "https://pubmed.ncbi.nlm.nih.gov/25999877/",
  },
  {
    title: "Henshaw & Ferguson — Efficacy of individual computer-based auditory training for people with hearing loss: a systematic review",
    source: "PLOS ONE, 2013",
    url: "https://pubmed.ncbi.nlm.nih.gov/23675431/",
  },
  {
    title: "Shargorodsky et al. — Change in prevalence of hearing loss in US adolescents",
    source: "JAMA, 2010",
    url: "https://pubmed.ncbi.nlm.nih.gov/20716740/",
  },
  {
    title: "Liberman et al. — Toward a Differential Diagnosis of Hidden Hearing Loss in Humans",
    source: "PLOS ONE, 2016; 11(9):e0162726",
    url: "https://pubmed.ncbi.nlm.nih.gov/27618300/",
  },

];

function SciencePage() {
  return (
    <div className="min-h-screen">
      <SiteNav />

      <section className="hero-surface border-b border-border/60">
        <div className="mx-auto max-w-4xl px-5 py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 text-signal" /> Methods & evidence
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">The science behind Audiomaxxer</h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground">
            What we measure, why the methods are chosen, where the evidence comes from, and — just as important —
            what this app cannot tell you.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-5 px-5 py-14">
        {sections.map((s) => (
          <article key={s.title} className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
            <h2 className="text-xl font-semibold">{s.title}</h2>
            {s.body.map((p) => (
              <p key={p.slice(0, 32)} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </article>
        ))}

        <article className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <FlaskConical className="h-5 w-5 text-signal" /> Implementation details
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The exact parameters the screening runs with today, so the method can be judged rather than taken on trust.
          </p>
          <dl className="mt-5 space-y-4">
            {implementation.map((d) => (
              <div key={d.term} className="border-t border-border/60 pt-4 first:border-t-0 first:pt-0">
                <dt className="text-sm font-semibold">{d.term}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.value}</dd>
              </div>
            ))}
          </dl>
        </article>



        <article className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <AlertTriangle className="h-5 w-5 text-signal" /> Limitations
          </h2>
          <ul className="mt-4 space-y-3">
            {limitations.map((l) => (
              <li key={l.slice(0, 32)} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                {l}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-card">
          <h2 className="text-xl font-semibold">References</h2>
          <ul className="mt-4 space-y-4">
            {references.map((r) => (
              <li key={r.url}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-start gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
                >
                  {r.title}
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                </a>
                <p className="mt-1 text-xs text-muted-foreground">{r.source}</p>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
