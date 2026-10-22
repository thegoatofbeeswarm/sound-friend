/** English strings (data). Chinese and Spanish are in ./zh/data.ts and ./es/data.ts and load only when chosen. */
export const dataPage: Record<string, string> = {
  "device.hint.in-ear": "Earbuds or tips inside the ear canal",
  "device.hint.on-ear": "Pads rest on top of the ear",
  "device.hint.over-ear": "Cups surround the whole ear",
  "device.hint.bose-qc-ultra": "Over-ear, strong ANC",
  "device.hint.sony-wh1000xm6": "Over-ear, strong ANC",
  "device.hint.earpods-wired": "Unsealed wired buds",
  "device.hint.airpods": "Unsealed buds resting in the ear",
  "device.hint.airpods-pro-2": "Sealed tips, ANC",
  "device.hint.airpods-pro-3": "Sealed tips, adaptive ANC",
  "noise.noMic": "No microphone was found, so the room can't be checked. You can still take the test; its quality score will note the missing check.",
  "data.badge": "Your hearing data",
  "data.title": "Your clinic report next to your screenings",
  "data.lead":
    "Bring a past clinic or hearing-center result into the same view as your Audiomaxxer data. The comparison checks the measurements; it can't diagnose anything.",
  "data.signInPrompt": "Sign in to upload reports and inspect your saved hearing data.",
  "data.signIn": "Sign in",
  "data.howCalcTitle": "How the comparison is calculated",
  "data.howCalcDesc":
    "Only frequency-and-ear pairs visible in both datasets are compared, and they are compared by shape rather than by absolute level, because the two tests are not on the same scale.",
  "data.eq1.title": "Scale offset between the two tests",
  "data.eq1.detail":
    "The median gap between the two sets of numbers. A clinic reports calibrated dB HL and Audiomaxxer reports a relative estimate, so most of this gap is a difference of scale. We remove it before comparing anything.",
  "data.eq2.title": "Shape difference at one matched point",
  "data.eq2.detail":
    "What is left at each ear-and-frequency point once the scale offset is removed: how differently the two curves rise and fall. Small values mean both tests describe the same hearing pattern. We don't publish an average error against clinical dB HL, because that needs a measured calibration between the scales and we don't have one yet.",
  "data.table.title": "Matched threshold data",
  "data.table.subtitle": "{source} vs latest Audiomaxxer screening",
  "data.table.uploadPrompt": "Upload and analyze a report to populate this table.",
  "data.table.mae": "Scale offset",
  "data.table.header.ear": "Ear",
  "data.table.header.frequency": "Frequency",
  "data.table.header.audiomaxxer": "Audiomaxxer",
  "data.table.header.clinic": "Clinic",
  "data.table.header.difference": "Shape difference",
  "data.table.empty":
    "There are no matched ear-frequency points yet. Audiomaxxer currently tests {freqs} Hz; a clinic report needs a readable value at the same frequency for the calculation to include it.",
  "data.table.footnote":
    "These values compare units as printed. Clinic results are usually clinical dB HL, while Audiomaxxer levels are relative estimates that depend on your device. If the difference is large, go over the source reports with an audiologist.",

  "data.report.signIn":
    "Sign in to upload a clinic or hearing-center report and compare it with your Audiomaxxer screening.",
  "data.report.addTitle": "Add a past hearing report",
  "data.report.addDesc":
    "Upload an audiogram or hearing screening from a clinic or hearing center. An AI model reads the report, pulls out the air-conduction thresholds it can see, and compares them with your Audiomaxxer screenings.",
  "data.report.fileLabel": "Report file",
  "data.report.helperDefault": "PDF, PNG or JPG · up to 15 MB",
  "data.report.sourceLabel": "Source (optional)",
  "data.report.sourcePlaceholder": "Clinic or provider",
  "data.report.uploadBtn": "Upload and analyze",
  "data.report.analyzing": "Analyzing…",
  "data.report.note":
    "Keep the original report for clinical use. The AI reading is a shortcut and can miss symbols or values in a blurry scan.",
  "data.report.importedTitle": "Imported reports",
  "data.report.importedDesc": "Your private reports and extracted comparison notes.",
  "data.report.saved": "{n} saved",
  "data.report.empty": "No external reports yet.",
  "data.report.testDate": "Test date {date}",
  "data.report.dateUnknown": "Date not detected",
  "data.report.uploaded": "uploaded {date}",
  "data.report.statusCompared": "Compared",
  "data.report.statusFailed": "Needs another upload",
  "data.report.statusEmpty": "No thresholds found",
  "data.report.statusProcessing": "Processing",
  "data.report.aiComparison": "AI comparison",
  "data.report.next": "Next:",
  "data.report.errChooseFile": "Choose a PDF, PNG or JPG hearing report.",
  "data.report.errFileSize": "The file must be between 1 byte and 15 MB.",
  "data.report.errAnalyzeFail": "We couldn't read that report. Try a clearer scan or a PDF.",
  "data.report.errSaveFail": "Couldn't save the report. Try again.",
  "data.report.toastAnalyzed": "Report analyzed · {n} threshold(s) found",

  "noise.title": "Room noise",
  "noise.scanPrompt": "Scan your surroundings before testing.",
  "noise.tooLoud": "Background noise reads high (about {n} on this microphone's relative scale). Find a quieter spot.",
  "noise.ok": "Background noise reads low (about {n} on this microphone's relative scale). Good to go.",
  "noise.error": "Microphone access was blocked. Allow it in your browser settings to scan the room.",
  "noise.stop": "Stop",
  "noise.scan": "Scan",

  "device.question": "What are you listening with?",
  "device.desc":
    "Headphones differ in how loud the same signal sounds. For a known model the test applies an estimated level offset; it isn't a calibration of your own headphones.",
  "device.calibratedAria": "Model with an estimated adjustment",
  "device.calibratedNote": "Estimated adjustment for this model.",
  "device.calibratedDetail":
    "Tones get an estimated offset for the typical response of the {device}, taken from published measurements of that model. Your own pair and fit can differ, so compare results on the same setup.",
  "device.uncalibratedNote": "No adjustment for these headphones.",
  "device.uncalibratedDetail":
    "We only assume a generic {hint} response. Results still track relative changes on the same setup, but levels may be off by several dB.",
  "device.peaks": "peaks ~{db} dB",

  "how.title": "How Audiomaxxer works",
  "how.desc":
    "Audiomaxxer is a closed loop. Every screening changes your training, and every training block feeds the next screening comparison.",
  "how.scienceLink": "The science behind it",
  "how.step": "STEP",
  "how.step.screen.title": "Screen",
  "how.step.screen.body":
    "In each ear, adaptive tones narrow in on the quietest level you can hear at each frequency.",
  "how.step.analyze.title": "Analyze",
  "how.step.analyze.body":
    "Your responses build a hearing profile that shows where you are strong and where sensitivity drops.",
  "how.step.train.title": "Train",
  "how.step.train.body":
    "Exercises focus on the sounds your profile says you find hardest to tell apart.",
  "how.step.adapt.title": "Adapt",
  "how.step.adapt.body": "How you perform in a session changes the difficulty and content of the next one.",
  "how.step.track.title": "Track",
  "how.step.track.body":
    "Repeat screenings show how your profile moves over weeks and months. ",
  "how.feedbackPre":
    "Step 5 feeds back into step 3: an updated profile re-targets your training, so you don't repeat the same exercises. We call this {loop}.",
  "how.closedLoop": "closed loop",

  "example.title": "Your hearing profile",
  "example.badge": "Example result",
  "example.detected": "Audiomaxxer detected",
  "example.finding1": "Strong low-frequency hearing",
  "example.finding2": "Slightly reduced sensitivity at 4–8 kHz",
  "example.finding3": "Recommended training: speech-in-noise + high-frequency recognition",
  "example.cta": "See what your hearing looks like",
  "example.footnote": "This is sample data. Try your own screening to see real results.",
};
