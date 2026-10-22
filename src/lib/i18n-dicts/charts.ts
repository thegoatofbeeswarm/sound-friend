/** English strings (charts). Chinese and Spanish are in ./zh/charts.ts and ./es/charts.ts and load only when chosen. */
export const charts: Record<string, string> = {
  "chart.frequencyHz": "Frequency (Hz)",
  "chart.hearingLevel": "Estimated level (dB, relative)",
  "chart.leftEar": "Left ear",
  "chart.rightEar": "Right ear",
  "chart.hz": "{v} Hz",
  "chart.dbHl": "{v} dB",
  "chart.audiogramHelp":
    "Read it like an audiogram: quieter sounds sit at the top, so a line high on the chart means you heard softer tones. The levels are estimates that depend on your device, not clinical dB HL, so use them to compare your own screenings over time.",
  "chart.accuracy": "Accuracy %",
  "chart.difficulty": "Difficulty reached",

  "quality.title": "Screening quality",
  "quality.compact": "Screening quality {score}/100 · {label}",
  "quality.heading": "Screening quality: {label}",
  "quality.label.excellent": "Excellent conditions",
  "quality.label.good": "Good conditions",
  "quality.label.fair": "Fair conditions",
  "quality.label.low": "Limited reliability",
  "quality.interpretation.excellent":
    "Absolute thresholds from this screening can be compared to standard ranges with confidence.",
  "quality.interpretation.good":
    "Thresholds are dependable for tracking, with roughly a few dB of uncertainty.",
  "quality.interpretation.fair":
    "Use this run for relative tracking; absolute thresholds may be shifted by conditions.",
  "quality.interpretation.low":
    "Treat these numbers as indicative only and repeat the screening in better conditions.",
  "quality.issue.noNoiseScan": "Room noise was not measured before the screening.",
  "quality.issue.noisy": "Background noise read about {db} on the microphone, which can mask the quietest tones.",
  "quality.issue.veryNoisy": "Background noise read about {db} on the microphone, too loud for reliable quiet tones.",
  "quality.issue.noDevice": "No listening device was recorded for this screening.",
  "quality.issue.uncalibrated":
    "No model profile for {device}, so levels may be off by several dB.",
  "quality.issue.fewTrials": "Only {n} trials were answered, so estimates stayed coarse.",
  "quality.issue.noTrials": "No trials recorded.",
  "quality.issue.lowConfidence": "Average estimate confidence was only {pct}%.",
  "quality.issue.unsettled":
    "At least one frequency never settled, so your answers there may have been inconsistent.",
  "quality.strength.veryQuiet": "Very quiet room (mic reading about {db}).",
  "quality.strength.quiet": "Reasonably quiet room (mic reading about {db}).",
  "quality.strength.calibrated": "{device} has an estimated correction profile applied.",
  "quality.strength.trials": "{n} trials answered.",
  "quality.strength.confidence": "Average estimate confidence {pct}%.",
  "quality.issue.catchFail": "Reported hearing a tone on {failed} of {total} silent catch trials.",
  "quality.issue.inconsistent": "Repeated tones got the same answer only {pct}% of the time.",
  "test.stepCatch": "Some rounds are silent. Choose \"Nothing\" when you hear no tone.",
  "quality.strength.catchPass": "Passed all {n} silent catch trials.",
  "quality.strength.consistent": "Answers agreed on {pct}% of repeated tones.",
};
