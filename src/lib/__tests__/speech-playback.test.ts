import { describe, expect, test } from "bun:test";
import { speakUtterance, type SpeechEngineLike, type UtteranceLike } from "../speech-playback";

function engine(script: (u: UtteranceLike) => void) {
  let cancelled = 0;
  const e: SpeechEngineLike & { cancelled: () => number } = {
    speak: (u) => script(u),
    cancel: () => void cancelled++,
    resume: () => {},
    speaking: false,
    paused: false,
    cancelled: () => cancelled,
  };
  return e;
}
const utterance = (): UtteranceLike => ({ onstart: null, onend: null, onerror: null });

describe("speech playback outcome", () => {
  test("start then end is delivered", async () => {
    const e = engine((u) => {
      u.onstart?.(undefined);
      setTimeout(() => u.onend?.(undefined), 5);
    });
    expect(await speakUtterance(e, utterance(), 200)).toBe("ok");
  });

  test("start then stall is not delivered, and is cancelled", async () => {
    const e = engine((u) => u.onstart?.(undefined));
    expect(await speakUtterance(e, utterance(), 30)).toBe("stalled");
    expect(e.cancelled()).toBe(1);
  });

  test("never starting is reported separately", async () => {
    const e = engine(() => {});
    expect(await speakUtterance(e, utterance(), 30)).toBe("not-started");
  });

  test("an error is an error", async () => {
    const e = engine((u) => u.onerror?.(undefined));
    expect(await speakUtterance(e, utterance(), 200)).toBe("error");
  });

  test("an end that arrives after the timeout does not turn a stall into success", async () => {
    let late: (() => void) | undefined;
    const e = engine((u) => {
      u.onstart?.(undefined);
      late = () => u.onend?.(undefined);
    });
    const result = await speakUtterance(e, utterance(), 20);
    late?.();
    expect(result).toBe("stalled");
  });

  test("an engine that throws on speak is an error", async () => {
    const e = engine(() => {
      throw new Error("blocked");
    });
    expect(await speakUtterance(e, utterance(), 200)).toBe("error");
  });
});
