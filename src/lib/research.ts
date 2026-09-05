/**
 * Research Mode.
 *
 * A normal screening lets people change headphones, volume and room between
 * sittings, so two results can differ for reasons that have nothing to do with
 * hearing. Research Mode freezes those conditions into a written protocol,
 * stamps every run with it, and only counts a repeat as comparable when the
 * conditions match. That is what makes the resulting test-retest numbers worth
 * publishing on the validation page.
 */

import { DEFAULT_DEVICE, type DeviceId } from "@/lib/devices";

export type ResearchProtocol = {
  device: DeviceId;
  /** Room noise in dB(A)-ish units captured when the protocol was locked. */
  environmentDb: number | null;
  /** System volume setting the participant promises to reuse, e.g. "50%". */
  volumeNote: string;
  /** Free-text location, e.g. "bedroom, door closed". */
  place: string;
  /** Local time of day of the first run, used only as a soft reminder. */
  timeNote: string;
  createdAt: string;
};

const KEY = "audiomaxxer.research.protocol";
const ACTIVE_KEY = "audiomaxxer.research.active";
const NOTE_PREFIX = "research:v1:";

/** Room noise may drift this much before a repeat stops being comparable. */
export const NOISE_TOLERANCE_DB = 6;

export function emptyProtocol(): ResearchProtocol {
  return {
    device: DEFAULT_DEVICE,
    environmentDb: null,
    volumeNote: "",
    place: "",
    timeNote: "",
    createdAt: new Date().toISOString(),
  };
}

export function loadProtocol(): ResearchProtocol | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResearchProtocol;
    return parsed && typeof parsed.device === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveProtocol(p: ResearchProtocol) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}

export function clearProtocol() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(ACTIVE_KEY);
}

/** Research Mode is armed for the next screening. */
export function isArmed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ACTIVE_KEY) === "1";
}

export function setArmed(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) window.localStorage.setItem(ACTIVE_KEY, "1");
  else window.localStorage.removeItem(ACTIVE_KEY);
}

/** Encode the protocol into the free-text notes column of a saved test. */
export function encodeNotes(p: ResearchProtocol): string {
  return NOTE_PREFIX + JSON.stringify(p);
}

export function decodeNotes(notes: string | null): ResearchProtocol | null {
  if (!notes || !notes.startsWith(NOTE_PREFIX)) return null;
  try {
    return JSON.parse(notes.slice(NOTE_PREFIX.length)) as ResearchProtocol;
  } catch {
    return null;
  }
}

export function isResearchNote(notes: string | null): boolean {
  return !!notes && notes.startsWith(NOTE_PREFIX);
}

/** Did a run actually honour the locked protocol? */
export function conditionsMatch(
  p: ResearchProtocol,
  run: { device_type: string | null; environment_db: number | null },
): boolean {
  if (run.device_type !== p.device) return false;
  if (p.environmentDb == null || run.environment_db == null) return true;
  return Math.abs(run.environment_db - p.environmentDb) <= NOISE_TOLERANCE_DB;
}

export function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
