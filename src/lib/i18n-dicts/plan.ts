/** English strings (plan). Chinese and Spanish are in ./zh/plan.ts and ./es/plan.ts and load only when chosen. */
export const planPack: Record<string, string> = {
  "plan.title": "Your training plan",
  "plan.fromClinic": "Anchored to your clinic report: {source}",
  "plan.fromScreening": "Based on your latest Audiomaxxer screening",
  "plan.fromNone": "A starter plan. Take a screening or upload a clinic report and it gets rebuilt around your results.",
  "plan.step": "Step {n}",
  "plan.start": "Start this track",
  "plan.upload": "Bring your audiogram",
  "plan.uploadHint":
    "Upload a clinic or hearing-centre audiogram and this plan is rebuilt around the real measurement.",
  "plan.signedOut": "Sign in to get a plan built from your own results.",
  "plan.summaryHigh": "High frequencies (4 kHz+): {db} dB average",
  "plan.summaryLow": "Low frequencies: {db} dB average",
  "plan.summaryAsym": "Between ears at high frequencies: {db} dB apart",
  "plan.reason.highLoss":
    "Your high frequencies average {db} dB, the range where consonants live, so train there first.",
  "plan.reason.consonants":
    "Missing high-frequency detail is what makes speech in a busy room hard, so practise it directly.",
  "plan.reason.sinWeak":
    "Your speech-in-noise score is {score}/100, which makes understanding talk in noise your weakest area.",
  "plan.reason.followTalk": "Practise following a conversation and answering questions about it.",
  "plan.reason.asymmetry":
    "Your ears differ by about {db} dB up high, so where a sound comes from is worth practising.",
  "plan.reason.lowLoss":
    "Low frequencies average {db} dB, so work on picking real sounds out as they get quieter.",
  "plan.reason.general": "Speech in noise is the skill that transfers most to daily life.",
  "plan.reason.discrimination": "Fine pitch discrimination sharpens the detail your ears pass on.",
  "plan.reason.memory": "Fast speech stretches auditory attention and working memory.",
};
