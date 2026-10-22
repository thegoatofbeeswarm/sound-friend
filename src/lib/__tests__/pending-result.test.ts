import { beforeEach, describe, expect, test } from "bun:test";

const store = new Map<string, string>();
let blocked = false;
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (blocked) throw new Error("QuotaExceededError");
      store.set(k, v);
    },
    removeItem: (k: string) => void store.delete(k),
  },
};

const { savePending, loadPending, clearPending, safeReturnTo, PENDING_TTL_MS } = await import("../pending-result");

beforeEach(() => {
  store.clear();
  blocked = false;
});

describe("pending guest results", () => {
  test("a saved result comes back unchanged with its id", () => {
    const id = savePending("tone", { avg: 12 });
    const p = loadPending<{ avg: number }>("tone");
    expect(p?.id).toBe(id);
    expect(p?.payload.avg).toBe(12);
  });

  test("kinds are kept apart", () => {
    savePending("tone", { a: 1 });
    expect(loadPending("speech")).toBeNull();
  });

  test("expired and malformed entries are dropped", () => {
    savePending("tone", { a: 1 }, 0);
    expect(loadPending("tone", PENDING_TTL_MS + 1)).toBeNull();
    store.set("audiomaxxer.pending.tone.v1", "{not json");
    expect(loadPending("tone")).toBeNull();
    store.set("audiomaxxer.pending.tone.v1", JSON.stringify({ v: 2, id: "x", kind: "tone", createdAt: Date.now(), payload: {} }));
    expect(loadPending("tone")).toBeNull();
  });

  test("clearing removes it, so a result is saved once", () => {
    savePending("speech", { a: 1 });
    clearPending("speech");
    expect(loadPending("speech")).toBeNull();
  });

  test("rejected storage does not throw", () => {
    blocked = true;
    expect(savePending("tone", { a: 1 })).toBeNull();
  });
});

describe("safeReturnTo", () => {
  test("allows same-site paths only", () => {
    expect(safeReturnTo("/test")).toBe("/test");
    expect(safeReturnTo("/train")).toBe("/train");
    expect(safeReturnTo("//evil.com")).toBeUndefined();
    expect(safeReturnTo("https://evil.com")).toBeUndefined();
    expect(safeReturnTo("/test?x=1")).toBeUndefined();
    expect(safeReturnTo(42)).toBeUndefined();
  });
});
