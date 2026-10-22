/**
 * One spoken stimulus, with an honest outcome.
 *
 * Only the utterance's end event counts as delivery: in the Web Speech API
 * "start" and "end" are separate lifecycle events, and a start does not show
 * the whole item played. Speech that starts and then stalls past the timeout
 * is reported as "stalled" and cancelled, and the caller must not score it.
 */

export type PlaybackResult = "ok" | "unsupported" | "error" | "not-started" | "stalled";

/* eslint-disable @typescript-eslint/no-explicit-any -- matches the DOM handler signatures */
export interface UtteranceLike {
  onstart: ((this: any, ev: any) => any) | null;
  onend: ((this: any, ev: any) => any) | null;
  onerror: ((this: any, ev: any) => any) | null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface SpeechEngineLike<U extends UtteranceLike = UtteranceLike> {
  speak(u: U): void;
  cancel(): void;
  resume(): void;
  readonly speaking: boolean;
  readonly paused: boolean;
}

/** Generous time allowance for an item: a floor, plus time per character at the given rate. */
export function speechTimeoutMs(text: string, rate: number, floorMs = 8000): number {
  return Math.max(floorMs, Math.round((text.length * 110) / Math.max(0.3, rate)) + 3000);
}

export function speakUtterance<U extends UtteranceLike>(
  engine: SpeechEngineLike<U>,
  utterance: U,
  timeoutMs: number,
): Promise<PlaybackResult> {
  return new Promise((resolve) => {
    let started = false;
    let settled = false;
    let keepAlive: ReturnType<typeof setInterval> | undefined;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const finish = (result: PlaybackResult) => {
      if (settled) return;
      settled = true;
      if (keepAlive) clearInterval(keepAlive);
      if (watchdog) clearTimeout(watchdog);
      resolve(result);
    };
    utterance.onstart = () => {
      started = true;
    };
    utterance.onend = () => finish("ok");
    utterance.onerror = () => finish("error");
    // Chrome pauses long-running synthesis; resume keeps it flowing.
    keepAlive = setInterval(() => {
      if (engine.speaking && !engine.paused) engine.resume();
    }, 4000);
    try {
      engine.speak(utterance);
    } catch {
      finish("error");
      return;
    }
    watchdog = setTimeout(() => {
      // Delivery can't be confirmed: stop whatever is left and report it.
      try {
        engine.cancel();
      } catch {
        /* nothing to cancel */
      }
      finish(started ? "stalled" : "not-started");
    }, timeoutMs);
  });
}
