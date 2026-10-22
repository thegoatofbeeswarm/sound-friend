/** English strings (speech). Chinese and Spanish are in ./zh/speech.ts and ./es/speech.ts and load only when chosen. */
export const speechPage: Record<string, string> = {
  "nav.speech": "Speech test",
  "sin.title": "Speech in noise",
  "sin.lead":
    "Three spoken digits play against background chatter. The speech stays at one level while the noise rises, and we measure the signal-to-noise ratio at which you still get all three right.",
  "sin.why":
    "Because it's a ratio, it depends less on your volume setting than a tone test does. The speech comes from your browser's built-in voice, so compare results on the same device.",
  "sin.step1": "Wear headphones and set your device volume to a comfortable level.",
  "sin.step2": "Pick the background you want to be tested against.",
  "sin.step3": "Type the three digits you heard. Guess if you are unsure.",
  "sin.noiseLabel": "Background",
  "sin.noise.babble": "Cafe babble",
  "sin.noise.conversation": "Conversation",
  "sin.noise.traffic": "Street traffic",
  "sin.begin": "Start speech test",
  "sin.listening": "Listening…",
  "sin.prompt": "Which three digits did you hear?",
  "sin.trialOf": "Trial {n} of up to {max}",
  "sin.difficulty": "Difficulty",
  "sin.submit": "Submit",
  "sin.clear": "Clear",
  "sin.resultsTitle": "Your speech-in-noise result",
  "sin.srt": "Speech reception threshold",
  "sin.srtUnit": "dB SNR",
  "sin.scoreLabel": "Listening score",
  "sin.srtExplain":
    "You understood about half of the digit groups when the speech was {srt} dB relative to the background. Lower is better.",
  "sin.band.strong": "Strong speech-in-noise performance",
  "sin.band.typical": "Mid-range result on this test",
  "sin.band.watch": "Lower part of this test's range",
  "sin.band.difficult": "Noticeable difficulty in noise",
  "sin.interp.strong":
    "You pick out speech well below the noise level. Keep training with harder backgrounds and competing talkers.",
  "sin.interp.typical":
    "Your result is in the middle of this test's range. Retest after a couple of weeks of practice to see whether it moves.",
  "sin.interp.watch":
    "Your result is in the lower part of this test's range. Speech-in-noise practice targets exactly this.",
  "sin.interp.difficult":
    "Understanding speech in noise looks hard for you. It's worth training, and worth mentioning at a hearing check.",
  "sin.spread": "Estimate spread: {spread} dB across {reversals} turning points",
  "sin.again": "Test again",
  "sin.train": "Train speech in noise",
  "sin.viewHistory": "View history",
  "sin.signInSave": "Sign in to save this",
  "sin.saving": "Saving…",
  "sin.saved": "Speech test saved to your history.",
  "sin.saveFail": "Couldn't save this speech test. Try again.",
  "sin.disclaimer":
    "This measures listening performance, not a medical diagnosis. The speech is played by your device's built-in voice, so the signal-to-noise number is a nominal value and is best compared with your own past runs on the same device rather than with other people. Clinical audiometry remains the standard for diagnosing hearing loss.",
};
