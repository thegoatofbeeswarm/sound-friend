/**
 * Training categories. Each mode generates rounds of a different listening
 * skill, all synthesized in the browser with the Web Audio API (plus speech
 * synthesis for the speech-based modes).
 *
 * A mode's difficulty argument is the shared 1..10 trainer level.
 */

import { getAudioContext, unlockAudio } from "@/lib/audiometry";
import { playSoundscape, SOUNDSCAPES, levelToDb, loadSample } from "@/lib/soundscapes";

export type ModeId =
  | "soundscape"
  | "speech-in-noise"
  | "high-frequency"
  | "localization"
  | "frequency-discrimination"
  | "conversation"
  | "rapid-speech"
  | "restaurant"
  | "street"
  | "phone-call";

export interface ModeOption {
  id: string;
  label: string;
  hint?: string;
}

export interface ModeRound {
  prompt: string;
  options: ModeOption[];
  answerId: string;
  /** Plays the stimulus. Resolves when playback finishes. */
  play: () => Promise<void>;
}

export interface TrainingMode {
  id: ModeId;
  label: string;
  blurb: string;
  skill: string;
  /** lucide icon name used by the UI. */
  icon:
    | "waves"
    | "messages"
    | "sparkles"
    | "compass"
    | "music"
    | "users"
    | "gauge"
    | "utensils"
    | "car"
    | "phone";
  needsSpeech: boolean;
  makeRound: (level: number, ceilingDb: number) => ModeRound;
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

/**
 * Recently used items per bank, so a round rarely repeats what you just heard.
 * Remembers roughly half a bank (capped) before allowing a repeat.
 */
const recent = new Map<string, unknown[]>();

/**
 * Every bank is split in two halves: the "train" half is the only material
 * normal sessions ever use, the "transfer" half is held out so a transfer
 * check measures generalisation on items you have never practised.
 */
export type BankVariant = "train" | "transfer";
let bankVariant: BankVariant = "train";

export function setBankVariant(variant: BankVariant) {
  bankVariant = variant;
  recent.clear();
}

function bankFor<T>(arr: readonly T[]): readonly T[] {
  if (arr.length < 4) return arr;
  const half = arr.filter((_, i) => (i % 2 === 0) === (bankVariant === "train"));
  return half.length ? half : arr;
}

function pickFresh<T>(key: string, all: readonly T[]): T {
  const arr = bankFor(all);
  if (arr.length <= 1) return arr[0] as T;
  const seen = (recent.get(key) ?? []) as T[];
  const fresh = arr.filter((x) => !seen.includes(x));
  const chosen = pick(fresh.length ? fresh : arr);
  const memory = Math.min(12, Math.max(1, Math.floor(arr.length / 2)));
  recent.set(key, [chosen, ...seen.filter((x) => x !== chosen)].slice(0, memory));
  return chosen;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}


function gainFor(levelDb: number): number {
  const clamped = Math.max(0, Math.min(90, levelDb));
  return Math.max(0.0008, 0.28 * Math.pow(10, (clamped - 90) / 22));
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Resolve once the speech engine has actually loaded its voice list. */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve([]);
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length) return resolve(existing);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      synth.removeEventListener("voiceschanged", finish);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", finish);
    // Some engines only populate after a poll.
    const start = Date.now();
    const poll = setInterval(() => {
      if (synth.getVoices().length || Date.now() - start > 2500) {
        clearInterval(poll);
        finish();
      }
    }, 100);
  });
}

let speechWarmed = false;

/**
 * Prime the speech engine. The first utterance in a session is frequently
 * dropped (voices still loading, engine not yet started), which made the first
 * couple of speech-in-noise rounds play silence.
 */
export async function warmUpSpeech(): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (speechWarmed) return;
  speechWarmed = true;
  const voices = await loadVoices();
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    const v = voices.find((x) => x.lang?.toLowerCase().startsWith("en"));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
  await wait(150);
}

/** Speech synthesis with a rate and volume, resolving when it stops. */
async function speak(text: string, rate: number, volume: number): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    await wait(900);
    return;
  }
  const synth = window.speechSynthesis;
  const voices = await loadVoices();
  await warmUpSpeech();
  synth.cancel();
  // Chrome needs a beat between cancel() and speak() or the utterance is lost.
  await wait(120);
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.volume = Math.max(0.05, Math.min(1, volume));
    const v =
      voices.find((x) => x.default && x.lang?.toLowerCase().startsWith("en")) ??
      voices.find((x) => x.lang?.toLowerCase().startsWith("en"));
    if (v) u.voice = v;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearInterval(keepAlive);
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    // Chrome pauses long-running synthesis; resume keeps it flowing.
    const keepAlive = setInterval(() => {
      if (synth.speaking && !synth.paused) synth.resume();
    }, 4000);
    synth.speak(u);
    // Safety net in case the engine never fires onend.
    setTimeout(finish, 8000);
  });
}


/** A steady band of noise, used as a masker or as a fricative burst. */
async function noiseBurst(opts: {
  ms: number;
  type: BiquadFilterType;
  freq: number;
  q: number;
  gain: number;
  pan?: number;
}): Promise<void> {
  const ctx = await getAudioContext();
  await unlockAudio();
  const dur = opts.ms / 1000;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = opts.type;
  filter.frequency.value = opts.freq;
  filter.Q.value = opts.q;
  const g = ctx.createGain();
  const now = ctx.currentTime + 0.08;

  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0005, opts.gain), now + 0.02);
  g.gain.setValueAtTime(Math.max(0.0005, opts.gain), now + dur - 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  const pan = ctx.createStereoPanner();
  pan.pan.value = opts.pan ?? 0;
  src.connect(filter).connect(g).connect(pan).connect(ctx.destination);
  src.start(now);
  src.stop(now + dur + 0.05);
  await wait(opts.ms + 120);
}

/** A pure tone with optional pan. */
async function tone(freq: number, ms: number, gain: number, pan = 0): Promise<void> {
  const ctx = await getAudioContext();
  await unlockAudio();
  const dur = ms / 1000;
  const now = ctx.currentTime + 0.08;
  const osc = ctx.createOscillator();
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0005, gain), now + 0.03);
  g.gain.setValueAtTime(Math.max(0.0005, gain), now + dur - 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  osc.connect(g).connect(p).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.05);
  await wait(ms + 100);
}

/**
 * Looping background conversation noise for the speech modes: a real recording
 * of people talking in a busy public space. Returns a stop function.
 * Falls back to synthesized babble if the recording cannot be decoded.
 */
async function startBabble(gain: number): Promise<() => void> {
  const ctx = await getAudioContext();
  await unlockAudio();
  const buffer = await loadSample("/sounds/babble.ogg");
  if (buffer) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const g = ctx.createGain();
    // The recording is loudness-normalized, so scale it like the synth bed.
    g.gain.value = Math.max(0.0005, gain * 2.2);
    src.connect(g).connect(ctx.destination);
    src.start(ctx.currentTime + 0.02, Math.random() * Math.max(0, buffer.duration - 6));
    return () => {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    };
  }

  const len = Math.floor(ctx.sampleRate * 2);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = 0.9 * last + 0.1 * w;
    d[i] = last * 3;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.value = Math.max(0.0005, gain);
  // Slow modulation makes it sound like a room of voices rather than hiss.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 3.6;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = g.gain.value * 0.5;
  lfo.connect(lfoGain).connect(g.gain);
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start();
  lfo.start();
  return () => {
    try {
      src.stop();
      lfo.stop();
    } catch {
      /* already stopped */
    }
  };
}

/* ------------------------------------------------------------------ */
/* word banks                                                          */
/* ------------------------------------------------------------------ */

/**
 * Minimal-pair sets. Distractors come from the same set, so the choice really
 * tests fine phonetic detail rather than gross word shape.
 */
const WORD_SETS: string[][] = [
  ["boat", "coat", "goat", "note", "vote"],
  ["seat", "feet", "heat", "beat", "wheat"],
  ["pin", "thin", "fin", "shin", "chin"],
  ["cap", "cat", "cab", "can", "catch"],
  ["rice", "rise", "ride", "ripe", "right"],
  ["mask", "mast", "match", "map", "mat"],
  ["sing", "thing", "ring", "king", "wing"],
  ["sun", "son", "fun", "run", "ton"],
  ["bath", "bass", "batch", "back", "bad"],
  ["five", "fine", "file", "fight", "find"],
  ["shoe", "chew", "two", "true", "through"],
  ["light", "night", "might", "white", "bite"],
  ["pear", "bear", "chair", "share", "fair"],
  ["dish", "ditch", "did", "dig", "dim"],
  ["thought", "taught", "fought", "sought", "caught"],
  ["vest", "best", "rest", "test", "west"],
  ["lace", "race", "face", "place", "space"],
  ["moon", "noon", "soon", "spoon", "tune"],
  ["cold", "gold", "hold", "sold", "told"],
  ["chip", "ship", "sip", "tip", "trip"],
  ["half", "have", "hat", "hash", "hand"],
  ["press", "dress", "stress", "bless", "guess"],
  ["thirty", "thirsty", "dirty", "sturdy", "thursday"],
  ["free", "three", "tree", "she", "sea"],
];

const SENTENCES: Array<{ text: string; question: string; options: string[]; answer: string }> = [
  {
    text: "The meeting moved to Thursday morning.",
    question: "Which day was the meeting moved to?",
    options: ["Tuesday", "Thursday", "Saturday", "Sunday"],
    answer: "Thursday",
  },
  {
    text: "She left the keys on the kitchen table.",
    question: "Where did she leave the keys?",
    options: ["Kitchen table", "Front door", "Car seat", "Bedside drawer"],
    answer: "Kitchen table",
  },
  {
    text: "Take the second exit and turn right at the lights.",
    question: "Which exit should you take before turning right?",
    options: ["First", "Second", "Third", "Fourth"],
    answer: "Second",
  },
  {
    text: "The train to Bristol leaves from platform nine.",
    question: "Which platform does the Bristol train leave from?",
    options: ["Platform five", "Platform nine", "Platform one", "Platform seven"],
    answer: "Platform nine",
  },
  {
    text: "I ordered the soup instead of the salad.",
    question: "Which dish did the speaker order instead of the salad?",
    options: ["Soup", "Salad", "Sandwich", "Steak"],
    answer: "Soup",
  },
  {
    text: "He said the price went up by fifteen percent.",
    question: "By how much did he say the price went up?",
    options: ["Five percent", "Fifteen percent", "Fifty percent", "Thirteen percent"],
    answer: "Fifteen percent",
  },
  {
    text: "The appointment is at quarter past three.",
    question: "What time is the appointment?",
    options: ["Quarter past two", "Quarter past three", "Half past three", "Quarter to three"],
    answer: "Quarter past three",
  },
  {
    text: "Please bring your passport and a printed ticket.",
    question: "Which two things should you bring?",
    options: [
      "Passport and printed ticket",
      "Passport and photo",
      "Licence and ticket",
      "Passport only",
    ],
    answer: "Passport and printed ticket",
  },
  {
    text: "The parcel was delivered to the neighbour at number twelve.",
    question: "Which neighbour's house number took the parcel?",
    options: ["Number ten", "Number twelve", "Number twenty", "Number two"],
    answer: "Number twelve",
  },
  {
    text: "We are meeting outside the library, not the museum.",
    question: "Which building are you meeting outside of?",
    options: ["Outside the library", "Inside the library", "At the museum", "At the station"],
    answer: "Outside the library",
  },
  {
    text: "My flight lands at seven forty in the evening.",
    question: "What time does the flight land in the evening?",
    options: ["Seven fourteen", "Seven forty", "Seventeen forty", "Six forty"],
    answer: "Seven forty",
  },
  {
    text: "The recipe needs three eggs and a cup of milk.",
    question: "How many eggs does the recipe need?",
    options: ["Two", "Three", "Four", "Six"],
    answer: "Three",
  },
  {
    text: "She works in the office on Mondays and Wednesdays.",
    question: "Which two days is she in the office?",
    options: [
      "Mondays and Wednesdays",
      "Mondays and Fridays",
      "Tuesdays and Thursdays",
      "Wednesdays only",
    ],
    answer: "Mondays and Wednesdays",
  },
  {
    text: "Turn the heating down to nineteen degrees before you leave.",
    question: "What temperature should the heating be set to?",
    options: ["Nine degrees", "Ninety degrees", "Nineteen degrees", "Fifteen degrees"],
    answer: "Nineteen degrees",
  },
  {
    text: "The doctor prescribed one tablet twice a day.",
    question: "How often should the tablet be taken?",
    options: ["Once a day", "Twice a day", "Three times a day", "Every other day"],
    answer: "Twice a day",
  },
  {
    text: "Our table is booked under the name Patterson.",
    question: "Which surname is the table booked under?",
    options: ["Patterson", "Peterson", "Patten", "Pattinson"],
    answer: "Patterson",
  },
  {
    text: "The blue folder is on the top shelf in the cupboard.",
    question: "Which shelf is the blue folder on?",
    options: ["Top shelf", "Bottom drawer", "On the desk", "Under the chair"],
    answer: "Top shelf",
  },
  {
    text: "He cycled fourteen miles before breakfast on Sunday.",
    question: "How many miles did he cycle before breakfast?",
    options: ["Four miles", "Fourteen miles", "Forty miles", "Fifteen miles"],
    answer: "Fourteen miles",
  },
  {
    text: "The concert was cancelled because the singer was ill.",
    question: "Why was the concert cancelled?",
    options: ["The singer was ill", "Bad weather", "Low ticket sales", "A power cut"],
    answer: "The singer was ill",
  },
  {
    text: "Send the invoice to accounts before the end of the month.",
    question: "Which department should the invoice be sent to?",
    options: ["Accounts", "Sales", "The manager", "The client"],
    answer: "Accounts",
  },
  {
    text: "There is a bus every twenty minutes from the high street.",
    question: "How many minutes are there between buses?",
    options: ["Every ten minutes", "Every twenty minutes", "Every hour", "Every twelve minutes"],
    answer: "Every twenty minutes",
  },
  {
    text: "The password ends with the number thirty-six.",
    question: "Which number does the password end with?",
    options: ["Thirty-six", "Twenty-six", "Sixty-three", "Thirty-five"],
    answer: "Thirty-six",
  },
  {
    text: "We stayed in a small hotel near the harbour in Galway.",
    question: "Which part of Galway was the hotel near?",
    options: ["Near the harbour", "Near the airport", "In the city centre", "By the station"],
    answer: "Near the harbour",
  },
  {
    text: "The lecture starts in room B four on the second floor.",
    question: "Which room number does the lecture start in?",
    options: ["B four", "D four", "B fourteen", "P four"],
    answer: "B four",
  },
  {
    text: "Add the sugar after the butter has melted completely.",
    question: "At what point do you add the sugar?",
    options: [
      "After the butter melts",
      "Before the butter",
      "With the flour",
      "At the very end",
    ],
    answer: "After the butter melts",
  },
  {
    text: "My sister moved to Manchester in the spring.",
    question: "In which season did his sister move to Manchester?",
    options: ["Spring", "Summer", "Autumn", "Winter"],
    answer: "Spring",
  },
  {
    text: "The car needs new brake pads and an oil change.",
    question: "Which two things does the car need?",
    options: [
      "Brake pads and an oil change",
      "New tyres and an oil change",
      "Brake pads only",
      "A new battery",
    ],
    answer: "Brake pads and an oil change",
  },
  {
    text: "Leave the parcel with reception if nobody answers.",
    question: "What should you do with the parcel if nobody answers?",
    options: [
      "Leave it with reception",
      "Take it back",
      "Leave it at the door",
      "Try the neighbour",
    ],
    answer: "Leave it with reception",
  },
  {
    text: "Tickets cost eighteen pounds each, or fifty for a group.",
    question: "How much does a single ticket cost?",
    options: ["Eight pounds", "Eighteen pounds", "Eighty pounds", "Fifty pounds"],
    answer: "Eighteen pounds",
  },
  {
    text: "The dentist called to move your check-up to next Friday.",
    question: "Who called to move the check-up?",
    options: ["The dentist", "The doctor", "The optician", "The pharmacy"],
    answer: "The dentist",
  },
  {
    text: "Water the plants every third day while we are away.",
    question: "How often should the plants be watered?",
    options: ["Every day", "Every second day", "Every third day", "Once a week"],
    answer: "Every third day",
  },
  {
    text: "The film we booked starts at nine, not eight thirty.",
    question: "What time does the film actually start?",
    options: ["Eight thirty", "Nine", "Nine thirty", "Eight"],
    answer: "Nine",
  },
];


/**
 * High-frequency bands, labelled by pitch rather than by phonetic symbol —
 * "S vs TH vs F" as raw noise bursts is nearly impossible to name, so each
 * option now says how high it sits and gives a familiar example.
 */
const HF_BANDS = [
  { id: "b1", label: "Low hiss — like SH in \u201cshoe\u201d", freq: 1800, q: 1.1 },
  { id: "b2", label: "Mid hiss — like F in \u201cfan\u201d", freq: 3500, q: 1.2 },
  { id: "b3", label: "High hiss — like S in \u201csun\u201d", freq: 6500, q: 1.4 },
  { id: "b4", label: "Very high — like a kettle whistle", freq: 9500, q: 1.6 },
  { id: "b5", label: "Highest — a thin cymbal shimmer", freq: 13000, q: 2 },
];

/** A separate bank for rapid speech, so it never repeats the conversation set. */
const RAPID_SENTENCES: Array<{
  text: string;
  question: string;
  options: string[];
  answer: string;
}> = [
  {
    text: "The delivery driver said he would come back at half past four.",
    question: "What time will the driver come back?",
    options: ["Half past four", "Half past five", "Quarter past four", "Four o'clock"],
    answer: "Half past four",
  },
  {
    text: "Book the tennis court for Saturday, not Sunday, this week.",
    question: "Which day should the court be booked for?",
    options: ["Saturday", "Sunday", "Friday", "Monday"],
    answer: "Saturday",
  },
  {
    text: "There were sixty-seven people signed up for the workshop.",
    question: "How many people signed up?",
    options: ["Sixty-seven", "Seventy-six", "Sixty-seventeen", "Fifty-seven"],
    answer: "Sixty-seven",
  },
  {
    text: "Grandma's cat is called Pepper and the dog is called Biscuit.",
    question: "What is the cat called?",
    options: ["Pepper", "Biscuit", "Ginger", "Poppy"],
    answer: "Pepper",
  },
  {
    text: "The wifi password is written on the back of the router.",
    question: "Where is the wifi password written?",
    options: [
      "On the back of the router",
      "On the fridge",
      "In the drawer",
      "On the front door",
    ],
    answer: "On the back of the router",
  },
  {
    text: "We need three litres of paint for the hallway and two for the stairs.",
    question: "How much paint is needed for the hallway?",
    options: ["Three litres", "Two litres", "Five litres", "Four litres"],
    answer: "Three litres",
  },
  {
    text: "My brother's new job is in Leeds, starting in October.",
    question: "Which city is the new job in?",
    options: ["Leeds", "Liverpool", "London", "Luton"],
    answer: "Leeds",
  },
  {
    text: "Please reply to the email before Wednesday lunchtime.",
    question: "By when should you reply?",
    options: [
      "Wednesday lunchtime",
      "Wednesday evening",
      "Tuesday lunchtime",
      "Thursday morning",
    ],
    answer: "Wednesday lunchtime",
  },
  {
    text: "The bus fare went up from two pounds to two pounds fifty.",
    question: "What is the new bus fare?",
    options: ["Two pounds fifty", "Two pounds", "Three pounds fifty", "Two pounds fifteen"],
    answer: "Two pounds fifty",
  },
  {
    text: "She ordered a large black coffee and a cheese sandwich.",
    question: "What did she order to drink?",
    options: [
      "A large black coffee",
      "A large white coffee",
      "A small black coffee",
      "A cup of tea",
    ],
    answer: "A large black coffee",
  },
  {
    text: "The dishwasher finishes its cycle in about forty minutes.",
    question: "How long until the dishwasher finishes?",
    options: ["Forty minutes", "Fourteen minutes", "Four minutes", "An hour"],
    answer: "Forty minutes",
  },
  {
    text: "Take the medicine with food, never on an empty stomach.",
    question: "How should the medicine be taken?",
    options: [
      "With food",
      "On an empty stomach",
      "Before bed only",
      "With plenty of water only",
    ],
    answer: "With food",
  },
  {
    text: "Our flight number is BA two one nine from terminal five.",
    question: "Which terminal does the flight leave from?",
    options: ["Terminal five", "Terminal four", "Terminal nine", "Terminal one"],
    answer: "Terminal five",
  },
  {
    text: "The gym closes early on bank holidays, at six in the evening.",
    question: "What time does the gym close on bank holidays?",
    options: ["Six in the evening", "Nine in the evening", "Six in the morning", "Seven o'clock"],
    answer: "Six in the evening",
  },
  {
    text: "He forgot his umbrella on the bus, not in the office.",
    question: "Where did he forget his umbrella?",
    options: ["On the bus", "In the office", "At the cafe", "In the car"],
    answer: "On the bus",
  },
  {
    text: "The team scored twice in the last ten minutes of the game.",
    question: "How many goals were scored in the last ten minutes?",
    options: ["Two", "Ten", "One", "Three"],
    answer: "Two",
  },
  {
    text: "Rent is due on the first of every month by bank transfer.",
    question: "When is the rent due?",
    options: [
      "The first of every month",
      "The last day of the month",
      "Every second week",
      "The fifth of every month",
    ],
    answer: "The first of every month",
  },
  {
    text: "The recipe says to bake it at one hundred and eighty degrees.",
    question: "What oven temperature is needed?",
    options: [
      "One hundred and eighty degrees",
      "One hundred and eighteen degrees",
      "Eighty degrees",
      "Two hundred degrees",
    ],
    answer: "One hundred and eighty degrees",
  },
  {
    text: "Meet me by the fountain, just past the bookshop on your left.",
    question: "Where should you meet?",
    options: ["By the fountain", "Inside the bookshop", "At the car park", "By the statue"],
    answer: "By the fountain",
  },
  {
    text: "The washing machine repair costs ninety pounds including parts.",
    question: "How much does the repair cost?",
    options: ["Ninety pounds", "Nineteen pounds", "Nine pounds", "Nine hundred pounds"],
    answer: "Ninety pounds",
  },
  {
    text: "Her phone number ends in double four, seven, two.",
    question: "How does the phone number end?",
    options: ["Double four, seven, two", "Double four, two, seven", "Four, seven, two", "Double seven, four, two"],
    answer: "Double four, seven, two",
  },
  {
    text: "The parcel should arrive within three to five working days.",
    question: "How long should the parcel take?",
    options: [
      "Three to five working days",
      "Five to ten working days",
      "One to three working days",
      "Two weeks",
    ],
    answer: "Three to five working days",
  },
];

/* ------------------------------------------------------------------ */
/* real-world scene banks                                              */
/* ------------------------------------------------------------------ */

type Scene = { text: string; question: string; options: string[]; answer: string };

const RESTAURANT_SCENES: Scene[] = [
  {
    text: "I'll have the chicken curry, but with rice instead of naan.",
    question: "What did they order instead of naan?",
    options: ["Rice", "Salad", "Chips", "Soup"],
    answer: "Rice",
  },
  {
    text: "Could we move to the table by the window, it's quieter there.",
    question: "Where do they want to move?",
    options: ["By the window", "By the door", "Outside", "Upstairs"],
    answer: "By the window",
  },
  {
    text: "The bill came to forty-two pounds, so that's fourteen each.",
    question: "How much does each person pay?",
    options: ["Fourteen", "Forty", "Twenty-four", "Twelve"],
    answer: "Fourteen",
  },
  {
    text: "She's allergic to peanuts, so please check the sauce.",
    question: "What is she allergic to?",
    options: ["Peanuts", "Shellfish", "Dairy", "Eggs"],
    answer: "Peanuts",
  },
  {
    text: "Two coffees and one orange juice, no sugar in either coffee.",
    question: "How many coffees were ordered?",
    options: ["Two", "One", "Three", "None"],
    answer: "Two",
  },
  {
    text: "Our booking is under the name Patterson, for seven o'clock.",
    question: "What name is the booking under?",
    options: ["Patterson", "Peterson", "Patton", "Pemberton"],
    answer: "Patterson",
  },
  {
    text: "The waiter said the kitchen closes in twenty minutes.",
    question: "When does the kitchen close?",
    options: ["In twenty minutes", "In twelve minutes", "In two minutes", "At midnight"],
    answer: "In twenty minutes",
  },
  {
    text: "Let's split a starter and each get our own main.",
    question: "What are they sharing?",
    options: ["A starter", "A main", "A dessert", "A drink"],
    answer: "A starter",
  },
  {
    text: "Can we get the sauce on the side rather than on top?",
    question: "How do they want the sauce?",
    options: ["On the side", "On top", "Extra hot", "Left out"],
    answer: "On the side",
  },
  {
    text: "He's paying by card, and she's leaving the tip in cash.",
    question: "How is the tip being left?",
    options: ["In cash", "By card", "On the app", "Not at all"],
    answer: "In cash",
  },
];

const STREET_SCENES: Scene[] = [
  {
    text: "Cross here, then take the first left after the bank.",
    question: "Which turn should you take after the bank?",
    options: ["First left", "First right", "Second left", "Straight on"],
    answer: "First left",
  },
  {
    text: "The bus you want is the twenty-nine, from the far stop.",
    question: "Which bus number do you want?",
    options: ["Twenty-nine", "Ninety-two", "Twenty-five", "Nine"],
    answer: "Twenty-nine",
  },
  {
    text: "The station entrance is behind the scaffolding on the right.",
    question: "Where is the station entrance?",
    options: ["Behind the scaffolding", "Under the bridge", "Across the park", "Next to the bank"],
    answer: "Behind the scaffolding",
  },
  {
    text: "Wait for the green man, the cars turn fast on this corner.",
    question: "What should you wait for?",
    options: ["The green man", "The bus", "Your friend", "The rain to stop"],
    answer: "The green man",
  },
  {
    text: "It's about a ten minute walk, mostly uphill.",
    question: "How long is the walk?",
    options: ["Ten minutes", "Two minutes", "Twenty minutes", "An hour"],
    answer: "Ten minutes",
  },
  {
    text: "Meet me by the cafe on the corner, not the one inside.",
    question: "Which cafe should you meet at?",
    options: ["The one on the corner", "The one inside", "The one by the park", "Either one"],
    answer: "The one on the corner",
  },
  {
    text: "The taxi rank moved to the other side of the roadworks.",
    question: "What moved?",
    options: ["The taxi rank", "The bus stop", "The market", "The car park"],
    answer: "The taxi rank",
  },
  {
    text: "Careful, that lane is for bikes, not for walking.",
    question: "What is the lane for?",
    options: ["Bikes", "Walking", "Buses", "Parking"],
    answer: "Bikes",
  },
  {
    text: "The parade starts at noon so this road will be shut.",
    question: "When does the parade start?",
    options: ["Noon", "Nine", "Four", "Midnight"],
    answer: "Noon",
  },
  {
    text: "Keep going past the church and it's the blue door.",
    question: "What colour is the door?",
    options: ["Blue", "Green", "Red", "Black"],
    answer: "Blue",
  },
];

const PHONE_SCENES: Scene[] = [
  {
    text: "Your appointment has been moved to Wednesday at ten fifteen.",
    question: "What is the new appointment time?",
    options: ["Ten fifteen", "Ten fifty", "Nine fifteen", "Eleven fifteen"],
    answer: "Ten fifteen",
  },
  {
    text: "Please call back on oh one six three, double two four one.",
    question: "How does the number end?",
    options: ["Two two four one", "Two four four one", "Two two one four", "Four two two one"],
    answer: "Two two four one",
  },
  {
    text: "The engineer will arrive between two and four this afternoon.",
    question: "When will the engineer arrive?",
    options: ["Between two and four", "Between four and six", "Before noon", "Tomorrow morning"],
    answer: "Between two and four",
  },
  {
    text: "Your reference number is Alpha seven three Delta.",
    question: "What is the reference number?",
    options: ["Alpha seven three Delta", "Alpha three seven Delta", "Alpha seven three Bravo", "Delta seven three Alpha"],
    answer: "Alpha seven three Delta",
  },
  {
    text: "I'm calling about the order that was delivered damaged.",
    question: "Why are they calling?",
    options: ["A damaged delivery", "A late delivery", "A refund request", "A new order"],
    answer: "A damaged delivery",
  },
  {
    text: "We can refund you or send a replacement, whichever you prefer.",
    question: "What two options were offered?",
    options: ["Refund or replacement", "Refund or credit", "Repair or refund", "Credit or discount"],
    answer: "Refund or replacement",
  },
  {
    text: "The office is closed Friday, so try again on Monday morning.",
    question: "When should you try again?",
    options: ["Monday morning", "Friday morning", "Monday evening", "Sunday"],
    answer: "Monday morning",
  },
  {
    text: "Sorry, you've come through to accounts, I'll transfer you to sales.",
    question: "Where will they be transferred?",
    options: ["Sales", "Accounts", "Support", "Reception"],
    answer: "Sales",
  },
  {
    text: "The total on your account is one hundred and nineteen pounds.",
    question: "What is the total?",
    options: ["One hundred and nineteen", "One hundred and ninety", "One hundred and nine", "Nineteen"],
    answer: "One hundred and nineteen",
  },
  {
    text: "I've emailed the form, just sign it and send it back today.",
    question: "What should they do with the form?",
    options: ["Sign it and send it back", "Print and keep it", "Ignore it", "Post it next week"],
    answer: "Sign it and send it back",
  },
];



/* ------------------------------------------------------------------ */
/* modes                                                               */
/* ------------------------------------------------------------------ */

export const TRAINING_MODES: TrainingMode[] = [
  {
    id: "soundscape",
    label: "Everyday sounds",
    blurb: "Identify real recordings — traffic, a motorbike, people talking — as they get quieter.",
    skill: "Detection threshold",
    icon: "waves",
    needsSpeech: false,
    makeRound: (level, ceiling) => {
      const target = pickFresh("soundscape", SOUNDSCAPES);
      const choices = level >= 8 ? 5 : level >= 5 ? 4 : 3;
      // Distractors close in real-world loudness as the level rises.
      const spread = Math.max(12, 70 - level * 6);
      const near = SOUNDSCAPES.filter(
        (s) => s.id !== target.id && Math.abs(s.realDb - target.realDb) <= spread,
      );
      const pool = near.length >= choices - 1 ? near : SOUNDSCAPES.filter((s) => s.id !== target.id);
      const distractors = shuffle(pool).slice(0, choices - 1);
      const levelDb = levelToDb(level, ceiling);
      // Shorter exposure at higher levels leaves less time to work it out.
      const durationMs = Math.round(Math.max(750, 2400 - level * 150));
      return {
        prompt: "What did you hear?",
        options: shuffle([target, ...distractors]).map((s) => ({ id: s.id, label: s.label })),
        answerId: target.id,
        play: () => playSoundscape(target.id, levelDb, durationMs),
      };
    },
  },
  {
    id: "speech-in-noise",
    label: "Speech in conversation noise",
    blurb: "Understand single words spoken over a real recording of people talking.",
    skill: "Signal-to-noise ratio",
    icon: "messages",
    needsSpeech: true,
    makeRound: (level) => {
      const set = pickFresh("word-set", WORD_SETS);
      const answer = pickFresh("word", set);
      const optionCount = level >= 8 ? 5 : level >= 5 ? 4 : 3;
      const distractors = shuffle(set.filter((w) => w !== answer)).slice(0, optionCount - 1);
      // Conversation noise rises and the voice drops: a real SNR ramp.
      const babble = 0.02 + level * 0.022;
      const voice = Math.max(0.12, 1 - level * 0.085);
      return {
        prompt: "Which word was spoken?",
        options: shuffle([answer, ...distractors]).map((w) => ({ id: w, label: w })),
        answerId: answer,
        play: async () => {
          await warmUpSpeech();
          const stop = await startBabble(babble);
          await wait(500);
          await speak(answer, 0.95, voice);
          await wait(300);
          stop();
        },
      };
    },
  },
  {
    id: "high-frequency",
    label: "High-frequency recognition",
    blurb: "Place a hiss on the pitch scale — the range that fades first with age.",
    skill: "2-13 kHz resolution",
    icon: "sparkles",
    needsSpeech: false,
    makeRound: (level) => {
      // Easy levels use only well-separated bands; hard levels add the
      // neighbouring ones, so the choice gets genuinely finer.
      const bandCount = level >= 7 ? 5 : level >= 4 ? 4 : 3;
      const bands =
        bandCount === 3
          ? [HF_BANDS[0]!, HF_BANDS[2]!, HF_BANDS[4]!]
          : HF_BANDS.slice(0, bandCount);
      const target = pickFresh(`hf-${bandCount}`, bands);
      const gain = gainFor(82 - level * 4.5);
      return {
        prompt: "How high was that hiss?",
        options: shuffle(bands).map((f) => ({ id: f.id, label: f.label })),
        answerId: target.id,
        play: () =>
          noiseBurst({
            ms: Math.round(Math.max(90, 360 - level * 26)),
            type: "bandpass",
            freq: target.freq,
            // Narrower band = less spectral shape to go on.
            q: target.q * (1 + level * 0.12),
            gain,
          }),
      };
    },
  },
  {
    id: "localization",
    label: "Sound localization",
    blurb: "Say which side a sound came from. Needs stereo headphones.",
    skill: "Binaural balance",
    icon: "compass",
    needsSpeech: false,
    makeRound: (level) => {
      // Left/right offsets shrink hard with level: obvious at 1, a hair at 10.
      const spread = Math.max(0.05, 0.75 * Math.pow(0.76, level - 1));
      const positions = [
        { id: "left", label: "Left", pan: -spread },
        { id: "centre", label: "Centre", pan: 0 },
        { id: "right", label: "Right", pan: spread },
      ];
      const target = pick(positions);
      return {
        prompt: "Which side did it come from?",
        options: positions.map((p) => ({ id: p.id, label: p.label })),
        answerId: target.id,
        play: () =>
          noiseBurst({
            ms: Math.round(Math.max(110, 440 - level * 32)),
            type: "bandpass",
            freq: 1800,
            q: 0.9,
            gain: gainFor(66 - level * 2.4),
            pan: target.pan,
          }),
      };
    },
  },
  {
    id: "frequency-discrimination",
    label: "Frequency discrimination",
    blurb: "Two tones play. Decide whether the second is higher, lower or the same.",
    skill: "Pitch resolution",
    icon: "music",
    needsSpeech: false,
    makeRound: (level) => {
      const base = pickFresh(
        "freq-base",
        [
          250, 330, 440, 500, 620, 750, 880, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 3500, 4000,
          5000, 6000, 7000, 8000,
        ],
      );
      // Higher level = smaller pitch difference (down to ~0.3%).
      const pct = Math.max(0.003, 0.1 * Math.pow(0.7, level - 1));
      const direction = pickFresh("freq-dir", ["higher", "lower", "same"] as const);
      const second =
        direction === "same" ? base : direction === "higher" ? base * (1 + pct) : base * (1 - pct);
      const gain = gainFor(64 - level * 1.4);
      const toneMs = Math.round(Math.max(160, 440 - level * 26));
      return {
        prompt: "Was the second tone higher, lower, or the same?",
        options: [
          { id: "higher", label: "Higher" },
          { id: "same", label: "The same" },
          { id: "lower", label: "Lower" },
        ],
        answerId: direction,
        play: async () => {
          await tone(base, toneMs, gain);
          await wait(Math.round(180 + level * 45));
          await tone(second, toneMs, gain);
        },
      };
    },
  },
  {
    id: "conversation",
    label: "Conversation simulation",
    blurb: "Follow a sentence over real conversation noise, then answer a question about it.",
    skill: "Working memory in noise",
    icon: "users",
    needsSpeech: true,
    makeRound: (level) => {
      const item = pickFresh("sentence-conversation", SENTENCES);
      const babble = 0.02 + level * 0.019;
      const voice = Math.max(0.15, 1 - level * 0.08);
      // The talker also speeds up as the level rises.
      const rate = 0.95 + Math.max(0, level - 4) * 0.09;
      return {
        prompt: item.question,
        options: shuffle(item.options).map((o) => ({ id: o, label: o })),
        answerId: item.answer,
        play: async () => {
          await warmUpSpeech();
          const stop = await startBabble(babble);
          await wait(500);
          await speak(item.text, rate, voice);
          await wait(300);
          stop();
        },
      };
    },
  },
  {
    id: "rapid-speech",
    label: "Rapid speech",
    blurb: "Keep up when the speaker talks fast. No background noise.",
    skill: "Temporal processing",
    icon: "gauge",
    needsSpeech: true,
    makeRound: (level) => {
      const item = pickFresh("sentence-rapid", RAPID_SENTENCES);
      const rate = 1.15 + level * 0.15; // up to ~2.6x
      const voice = Math.max(0.35, 1 - level * 0.055);
      return {
        prompt: item.question,
        options: shuffle(item.options).map((o) => ({ id: o, label: o })),
        answerId: item.answer,
        play: async () => {
          await warmUpSpeech();
          await speak(item.text, rate, voice);
        },
      };
    },
  },
  /* ---------------- real-world scenes ---------------- */
  {
    id: "restaurant",
    label: "Restaurant table",
    blurb: "Catch an order across a busy table: voices, clatter and all.",
    skill: "Speech in a crowded room",
    icon: "utensils",
    needsSpeech: true,
    makeRound: (level) => {
      const item = pickFresh("scene-restaurant", RESTAURANT_SCENES);
      const babble = 0.03 + level * 0.026;
      const voice = Math.max(0.14, 1 - level * 0.08);
      const rate = 0.98 + Math.max(0, level - 3) * 0.07;
      return {
        prompt: item.question,
        options: shuffle(item.options).map((o) => ({ id: o, label: o })),
        answerId: item.answer,
        play: async () => {
          await warmUpSpeech();
          const stop = await startBabble(babble);
          void noiseBurst({ ms: 220, type: "highpass", freq: 4200, q: 0.8, gain: 0.02 + level * 0.006 });
          await wait(520);
          await speak(item.text, rate, voice);
          await wait(250);
          stop();
        },
      };
    },
  },
  {
    id: "street",
    label: "Street corner",
    blurb: "Follow directions over real traffic before the light changes.",
    skill: "Speech in low-frequency noise",
    icon: "car",
    needsSpeech: true,
    makeRound: (level) => {
      const item = pickFresh("scene-street", STREET_SCENES);
      const traffic = 0.025 + level * 0.024;
      const voice = Math.max(0.16, 1 - level * 0.075);
      const rate = 1 + Math.max(0, level - 3) * 0.07;
      return {
        prompt: item.question,
        options: shuffle(item.options).map((o) => ({ id: o, label: o })),
        answerId: item.answer,
        play: async () => {
          await warmUpSpeech();
          const stop = await startLoop("/sounds/traffic.ogg", traffic);
          await wait(520);
          await speak(item.text, rate, voice);
          await wait(250);
          stop();
        },
      };
    },
  },
  {
    id: "phone-call",
    label: "Phone call",
    blurb: "A thin, hissy line with no lips to read — pure listening.",
    skill: "Degraded-channel speech",
    icon: "phone",
    needsSpeech: true,
    makeRound: (level) => {
      const item = pickFresh("scene-phone", PHONE_SCENES);
      const voice = Math.max(0.18, 0.9 - level * 0.07);
      const rate = 1.02 + Math.max(0, level - 2) * 0.08;
      const hiss = 0.012 + level * 0.009;
      return {
        prompt: item.question,
        options: shuffle(item.options).map((o) => ({ id: o, label: o })),
        answerId: item.answer,
        play: async () => {
          await warmUpSpeech();
          void noiseBurst({ ms: 2600, type: "bandpass", freq: 2200, q: 0.7, gain: hiss });
          await wait(250);
          await speak(item.text, rate, voice);
        },
      };
    },
  },
];



export function modeById(id: string): TrainingMode {
  return TRAINING_MODES.find((m) => m.id === id) ?? (TRAINING_MODES[0] as TrainingMode);
}
