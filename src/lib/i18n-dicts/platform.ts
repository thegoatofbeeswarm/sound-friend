/** English strings (platform). Chinese and Spanish are in ./zh/platform.ts and ./es/platform.ts and load only when chosen. */
export const platformPack: Record<string, string> = {
  "trend.sinceSameSkills": "(since {date}, same skills)",
  "trend.waitForComparable": "You just added a skill to your profile. A change will show once you've measured the same skills again.",
  "coach.privacy": "Your messages, plus a summary of your saved screenings, reports, training and headphone setup, are sent to Google's Gemini model through the Lovable AI Gateway to write each answer. You can delete a conversation at any time.",
  "data.privacy": "Your report is stored privately in your account and sent to Google's Gemini model, through the Lovable AI Gateway, so it can read the thresholds. You can't delete a report in the app yet; email the team (see the Team page) to have one removed.",
  "train.languageNote": "Speech exercises use English recordings and voices, whatever language this page is in.",
  "sin.languageNote": "The spoken digits are in English, whatever language this page is in.",
  "trend.mixNote": "Your profile now covers different skills than it did earlier, and the overall score is an average of whatever is measured, so the line jumps there. Changes are only compared while the same skills are covered.",
  "profile.coverage": "Based on {n} of 5 skills measured so far",
  /* homepage five-part profile */
  "five.exampleTitle": "Example listening profile",
  "five.exampleBadge": "Sample data",
  "five.overall": "Overall listening",
  "five.focus": "Your recommended focus",
  "five.startTraining": "Start 5-minute training",
  "five.dimsTitle": "Hearing is more than sensitivity",
  "five.dimsLead":
    "A tone test shows you how quiet a sound you can detect. These five measures describe how you listen:",
  "five.dim.sensitivity.body": "The softest tone you can detect at each pitch. ",
  "five.dim.speech.body":
    "How much background noise you can take and still understand spoken digits or sentences.",
  "five.dim.discrimination.body":
    "Telling apart pitches and fine spectral detail that sit close together.",
  "five.dim.attention.body":
    "Holding on to one sound source while other sounds distract you.",
  "five.dim.memory.body":
    "Keeping what you just heard in mind long enough to make sense of a whole sentence.",

  /* cohort validation */
  "cohort.title": "Validation data",
  "cohort.lead":
    "Pooled, anonymous numbers from everyone using Audiomaxxer: counts and repeatability, with no names or accounts. Check them yourself.",
  "cohort.participants": "Participants",
  "cohort.screenings": "Screenings",
  "cohort.repeat": "Repeat screenings",
  "cohort.retest": "Same-device test-retest",
  "cohort.retestHint": "Mean absolute difference between two sittings on the same hardware.",
  "cohort.within": "Retest points within 10 dB",
  "cohort.speech": "Speech-in-noise repeatability",
  "cohort.speechHint": "Mean change in speech reception threshold between sittings.",
  "cohort.speechTests": "Speech tests",
  "cohort.clinic": "Clinic reports uploaded",
  "cohort.clinicHint": "Reports available for pattern comparison.",
  "cohort.byDevice": "Repeatability by device",
  "cohort.byBand": "Repeatability by pitch region",
  "cohort.device": "Device",
  "cohort.pairs": "Matched points",
  "cohort.spread": "Test-retest spread",
  "cohort.band.low": "Low pitches (under 1 kHz)",
  "cohort.band.mid": "Mid pitches (1-4 kHz)",
  "cohort.band.high": "High pitches (4 kHz and up)",
  "cohort.none": "Not enough data yet",
  "cohort.unknown": "Unspecified device",
  "cohort.note":
    "Repeatability shows how stable a screening is when you repeat it. A test has to be repeatable before it can be accurate, but repeatability alone doesn't make it accurate or replace a calibrated clinical measurement.",

  /* pattern comparison (replaces absolute error against dB HL) */
  "valid.scaleWarn": "Different scales",
  "valid.scaleNote":
    "A clinic measures dB HL on a calibrated audiometer. Audiomaxxer reports a relative, device-dependent estimated level. Subtracting one from the other would produce an error figure that looks meaningful but is not, so we compare the shape of the two curves instead.",
  "valid.patternTitle": "Pattern comparison",
  "valid.patternMatch": "Pattern match",
  "valid.patternHint": "How closely the two curves rise and fall together.",
  "valid.offset": "Scale offset",
  "valid.offsetHint": "Constant gap between the scales. We remove it before comparing because it isn't an error.",
  "valid.shapeSpread": "Shape difference",
  "valid.shapeHint": "Average mismatch after the offset is removed.",
  "valid.withinShape": "Points within 10 dB of the shared shape",
  "valid.agree.strong": "The two tests describe the same hearing pattern",
  "valid.agree.moderate": "Broadly the same pattern, with some points off",
  "valid.agree.weak": "The patterns do not line up yet",
  "valid.sameBand": "Both tests show relatively lower sensitivity around {band}.",
  "valid.diffBand":
    "Your clinic report is weakest around {clinic}, while this screening is weakest around {app}.",
  "valid.band.low": "500 Hz-1 kHz",
  "valid.band.mid": "1-4 kHz",
  "valid.band.high": "4-8 kHz",
  "valid.tableShape": "Shape difference",
  "valid.tableAppUnit": "estimated level",
  "valid.tableClinicUnit": "dB HL",
  "valid.noAbsolute":
    "We deliberately do not publish an average error against clinical dB HL. That number needs a measured calibration between the two scales, and we do not have one yet.",
  "valid.yourData": "Your clinic comparison",
};
