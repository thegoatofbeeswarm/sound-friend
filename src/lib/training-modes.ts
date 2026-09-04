/**
 * Training categories. Each mode generates rounds of a different listening
 * skill, all synthesized in the browser with the Web Audio API (plus speech
 * synthesis for the speech-based modes).
 *
 * A mode's difficulty argument is the shared 1..10 trainer level.
 */

import { getAudioContext } from "@/lib/audiometry";
import { playSoundscape, SOUNDSCAPES, levelToDb } from "@/lib/soundscapes";

export type ModeId =
  | "soundscape"
  | "speech-in-noise"
  | "high-frequency"
  | "localization"
  | "frequency-discrimination"
  | "conversation"
  | "rapid-speech";

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
  icon: "waves" | "messages" | "sparkles" | "compass" | "music" | "users" | "gauge";
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

function pickFresh<T>(key: string, arr: readonly T[]): T {
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
  const dur = ms / 1000;
  const now = ctx.currentTime + 0.02;
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

/** Looping background babble for the speech modes. Returns a stop function. */
async function startBabble(gain: number): Promise<() => void> {
  const ctx = await getAudioContext();
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
    question: "Which day was mentioned?",
    options: ["Tuesday", "Thursday", "Saturday", "Sunday"],
    answer: "Thursday",
  },
  {
    text: "She left the keys on the kitchen table.",
    question: "Where were the keys left?",
    options: ["Kitchen table", "Front door", "Car seat", "Bedside drawer"],
    answer: "Kitchen table",
  },
  {
    text: "Take the second exit and turn right at the lights.",
    question: "Which exit?",
    options: ["First", "Second", "Third", "Fourth"],
    answer: "Second",
  },
  {
    text: "The train to Bristol leaves from platform nine.",
    question: "Which platform?",
    options: ["Platform five", "Platform nine", "Platform one", "Platform seven"],
    answer: "Platform nine",
  },
  {
    text: "I ordered the soup instead of the salad.",
    question: "What was ordered?",
    options: ["Soup", "Salad", "Sandwich", "Steak"],
    answer: "Soup",
  },
  {
    text: "He said the price went up by fifteen percent.",
    question: "By how much?",
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
    question: "What should you bring?",
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
    question: "Which house number?",
    options: ["Number ten", "Number twelve", "Number twenty", "Number two"],
    answer: "Number twelve",
  },
  {
    text: "We are meeting outside the library, not the museum.",
    question: "Where are you meeting?",
    options: ["Outside the library", "Inside the library", "At the museum", "At the station"],
    answer: "Outside the library",
  },
  {
    text: "My flight lands at seven forty in the evening.",
    question: "When does the flight land?",
    options: ["Seven fourteen", "Seven forty", "Seventeen forty", "Six forty"],
    answer: "Seven forty",
  },
  {
    text: "The recipe needs three eggs and a cup of milk.",
    question: "How many eggs?",
    options: ["Two", "Three", "Four", "Six"],
    answer: "Three",
  },
  {
    text: "She works in the office on Mondays and Wednesdays.",
    question: "Which days is she in the office?",
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
    question: "What temperature?",
    options: ["Nine degrees", "Ninety degrees", "Nineteen degrees", "Fifteen degrees"],
    answer: "Nineteen degrees",
  },
  {
    text: "The doctor prescribed one tablet twice a day.",
    question: "How often?",
    options: ["Once a day", "Twice a day", "Three times a day", "Every other day"],
    answer: "Twice a day",
  },
  {
    text: "Our table is booked under the name Patterson.",
    question: "Which name is the booking under?",
    options: ["Patterson", "Peterson", "Patten", "Pattinson"],
    answer: "Patterson",
  },
  {
    text: "The blue folder is on the top shelf in the cupboard.",
    question: "Where is the blue folder?",
    options: ["Top shelf", "Bottom drawer", "On the desk", "Under the chair"],
    answer: "Top shelf",
  },
  {
    text: "He cycled fourteen miles before breakfast on Sunday.",
    question: "How far did he cycle?",
    options: ["Four miles", "Fourteen miles", "Forty miles", "Fifteen miles"],
    answer: "Fourteen miles",
  },
  {
    text: "The concert was cancelled because the singer was ill.",
    question: "Why was it cancelled?",
    options: ["The singer was ill", "Bad weather", "Low ticket sales", "A power cut"],
    answer: "The singer was ill",
  },
  {
    text: "Send the invoice to accounts before the end of the month.",
    question: "Where should the invoice go?",
    options: ["Accounts", "Sales", "The manager", "The client"],
    answer: "Accounts",
  },
  {
    text: "There is a bus every twenty minutes from the high street.",
    question: "How often does the bus run?",
    options: ["Every ten minutes", "Every twenty minutes", "Every hour", "Every twelve minutes"],
    answer: "Every twenty minutes",
  },
  {
    text: "The password ends with the number thirty-six.",
    question: "Which number does it end with?",
    options: ["Thirty-six", "Twenty-six", "Sixty-three", "Thirty-five"],
    answer: "Thirty-six",
  },
  {
    text: "We stayed in a small hotel near the harbour in Galway.",
    question: "Where did they stay?",
    options: ["Near the harbour", "Near the airport", "In the city centre", "By the station"],
    answer: "Near the harbour",
  },
  {
    text: "The lecture starts in room B four on the second floor.",
    question: "Which room?",
    options: ["B four", "D four", "B fourteen", "P four"],
    answer: "B four",
  },
  {
    text: "Add the sugar after the butter has melted completely.",
    question: "When do you add the sugar?",
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
    question: "When did she move?",
    options: ["Spring", "Summer", "Autumn", "Winter"],
    answer: "Spring",
  },
  {
    text: "The car needs new brake pads and an oil change.",
    question: "What does the car need?",
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
    question: "What if nobody answers?",
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
    question: "How much is one ticket?",
    options: ["Eight pounds", "Eighteen pounds", "Eighty pounds", "Fifty pounds"],
    answer: "Eighteen pounds",
  },
  {
    text: "The dentist called to move your check-up to next Friday.",
    question: "Who called?",
    options: ["The dentist", "The doctor", "The optician", "The pharmacy"],
    answer: "The dentist",
  },
  {
    text: "Water the plants every third day while we are away.",
    question: "How often should you water them?",
    options: ["Every day", "Every second day", "Every third day", "Once a week"],
    answer: "Every third day",
  },
  {
    text: "The film we booked starts at nine, not eight thirty.",
    question: "What time does the film start?",
    options: ["Eight thirty", "Nine", "Nine thirty", "Eight"],
    answer: "Nine",
  },
];


/** Fricatives are the first thing to go with high-frequency loss. */
const FRICATIVES = [
  { id: "s", label: "S  (sss)", freq: 6500, q: 1.4 },
  { id: "sh", label: "SH  (shh)", freq: 3000, q: 1.2 },
  { id: "f", label: "F  (fff)", freq: 8000, q: 0.8 },
  { id: "th", label: "TH  (thh)", freq: 5200, q: 0.7 },
];

/* ------------------------------------------------------------------ */
/* modes                                                               */
/* ------------------------------------------------------------------ */

export const TRAINING_MODES: TrainingMode[] = [
  {
    id: "soundscape",
    label: "Everyday sounds",
    blurb: "Identify real-world sounds as they get quieter and quieter.",
    skill: "Detection threshold",
    icon: "waves",
    needsSpeech: false,
    makeRound: (level, ceiling) => {
      const target = pickFresh("soundscape", SOUNDSCAPES);
      const choices = level >= 8 ? 5 : level >= 5 ? 4 : 3;
      const spread = level >= 6 ? 25 : 60;
      const near = SOUNDSCAPES.filter(
        (s) => s.id !== target.id && Math.abs(s.realDb - target.realDb) <= spread,
      );
      const pool = near.length >= choices - 1 ? near : SOUNDSCAPES.filter((s) => s.id !== target.id);
      const distractors = shuffle(pool).slice(0, choices - 1);
      const levelDb = levelToDb(level, ceiling);
      return {
        prompt: "What did you hear?",
        options: shuffle([target, ...distractors]).map((s) => ({ id: s.id, label: s.label })),
        answerId: target.id,
        play: () => playSoundscape(target.id, levelDb),
      };
    },
  },
  {
    id: "speech-in-noise",
    label: "Speech in noise",
    blurb: "Understand single words spoken over cafe and classroom babble.",
    skill: "Signal-to-noise ratio",
    icon: "messages",
    needsSpeech: true,
    makeRound: (level) => {
      const set = pickFresh("word-set", WORD_SETS);
      const answer = pickFresh("word", set);
      const distractors = shuffle(set.filter((w) => w !== answer)).slice(0, level >= 6 ? 3 : 2);
      // Higher level = louder babble relative to speech.
      const babble = 0.02 + (level / 10) * 0.12;
      return {
        prompt: "Which word was spoken?",
        options: shuffle([answer, ...distractors]).map((w) => ({ id: w, label: w })),
        answerId: answer,
        play: async () => {
          await warmUpSpeech();
          const stop = await startBabble(babble);
          await wait(500);
          await speak(answer, 0.95, Math.max(0.25, 1 - level * 0.05));
          await wait(300);
          stop();
        },
      };
    },
  },
  {
    id: "high-frequency",
    label: "High-frequency recognition",
    blurb: "Tell apart S, F, TH and SH — the sounds that fade first.",
    skill: "3-8 kHz resolution",
    icon: "sparkles",
    needsSpeech: false,
    makeRound: (level) => {
      const target = pickFresh("fricative", FRICATIVES);
      const gain = gainFor(70 - level * 4);
      return {
        prompt: "Which sound was that?",
        options: shuffle(FRICATIVES).map((f) => ({ id: f.id, label: f.label })),
        answerId: target.id,
        play: () =>
          noiseBurst({
            ms: level >= 7 ? 180 : 320,
            type: "bandpass",
            freq: target.freq,
            q: target.q,
            gain,
          }),
      };
    },
  },
  {
    id: "localization",
    label: "Sound localization",
    blurb: "Say where a sound came from. Needs stereo headphones.",
    skill: "Binaural balance",
    icon: "compass",
    needsSpeech: false,
    makeRound: (level) => {
      // Higher level = smaller left/right offsets.
      const spread = Math.max(0.15, 1 - level * 0.085);
      const positions = [
        { id: "left", label: "Left", pan: -spread },
        { id: "centre-left", label: "Slightly left", pan: -spread / 2.5 },
        { id: "centre", label: "Centre", pan: 0 },
        { id: "centre-right", label: "Slightly right", pan: spread / 2.5 },
        { id: "right", label: "Right", pan: spread },
      ];
      const pool = level >= 5 ? positions : positions.filter((p) => p.id.indexOf("centre-") !== 0);
      const target = pick(pool);
      return {
        prompt: "Where did it come from?",
        options: pool.map((p) => ({ id: p.id, label: p.label })),
        answerId: target.id,
        play: () =>
          noiseBurst({
            ms: 420,
            type: "bandpass",
            freq: 1800,
            q: 0.9,
            gain: gainFor(62),
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
      const base = pickFresh("freq-base", [500, 750, 1000, 1500, 2000, 3000, 4000, 6000]);
      // Higher level = smaller pitch difference (down to ~0.5%).
      const pct = Math.max(0.005, 0.09 - level * 0.0085);
      const direction = pickFresh("freq-dir", ["higher", "lower", "same"] as const);
      const second =
        direction === "same" ? base : direction === "higher" ? base * (1 + pct) : base * (1 - pct);
      const gain = gainFor(62);
      return {
        prompt: "Was the second tone higher, lower, or the same?",
        options: [
          { id: "higher", label: "Higher" },
          { id: "same", label: "The same" },
          { id: "lower", label: "Lower" },
        ],
        answerId: direction,
        play: async () => {
          await tone(base, 420, gain);
          await wait(220);
          await tone(second, 420, gain);
        },
      };
    },
  },
  {
    id: "conversation",
    label: "Conversation simulation",
    blurb: "Follow a full sentence with background noise, then answer a question.",
    skill: "Working memory in noise",
    icon: "users",
    needsSpeech: true,
    makeRound: (level) => {
      const item = pickFresh("sentence-conversation", SENTENCES);
      const babble = 0.02 + (level / 10) * 0.1;
      return {
        prompt: item.question,
        options: shuffle(item.options).map((o) => ({ id: o, label: o })),
        answerId: item.answer,
        play: async () => {
          await warmUpSpeech();
          const stop = await startBabble(babble);
          await wait(500);
          await speak(item.text, 1, Math.max(0.3, 1 - level * 0.045));
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
      const item = pickFresh("sentence-rapid", SENTENCES);
      const rate = 1.2 + level * 0.13; // up to ~2.5x
      return {
        prompt: item.question,
        options: shuffle(item.options).map((o) => ({ id: o, label: o })),
        answerId: item.answer,
        play: async () => {
          await warmUpSpeech();
          await speak(item.text, rate, 1);
        },
      };
    },
  },
];

export function modeById(id: string): TrainingMode {
  return TRAINING_MODES.find((m) => m.id === id) ?? (TRAINING_MODES[0] as TrainingMode);
}
