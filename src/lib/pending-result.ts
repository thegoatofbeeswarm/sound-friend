/**
 * A finished result a guest has not saved yet. It is kept in localStorage so
 * signing in (which leaves the page) does not lose it, and it is attached to
 * an account only when the user presses save on the page it came from.
 */

export type PendingKind = "tone" | "speech" | "training";

export interface Pending<T> {
  v: 1;
  /** Random id, so a result is saved at most once. */
  id: string;
  kind: PendingKind;
  createdAt: number;
  payload: T;
}

/** Results older than this are dropped rather than offered for saving. */
export const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

const key = (kind: PendingKind) => `audiomaxxer.pending.${kind}.v1`;

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function newId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  return c?.randomUUID ? c.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** A fresh id for a finished result; it becomes the database client_result_id. */
export function newResultId(): string {
  return newId();
}

/**
 * Keep a finished result. `id` should be the result's own id so the pending
 * copy and the eventual database row share one identity.
 */
export function savePending<T>(kind: PendingKind, payload: T, now = Date.now(), id: string = newId()): string | null {
  const s = storage();
  if (!s) return null;
  const entry: Pending<T> = { v: 1, id, kind, createdAt: now, payload };
  try {
    s.setItem(key(kind), JSON.stringify(entry));
    return entry.id;
  } catch {
    // Storage full or blocked: the result is still on screen, it just won't survive sign-in.
    return null;
  }
}

export function loadPending<T>(kind: PendingKind, now = Date.now()): Pending<T> | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(key(kind));
    if (!raw) return null;
    const p = JSON.parse(raw) as Pending<T>;
    const valid =
      p && p.v === 1 && p.kind === kind && typeof p.id === "string" && typeof p.createdAt === "number" && p.payload != null;
    if (!valid || now - p.createdAt > PENDING_TTL_MS || p.createdAt > now + 60_000) {
      s.removeItem(key(kind));
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function clearPending(kind: PendingKind) {
  try {
    storage()?.removeItem(key(kind));
  } catch {
    /* nothing to clear */
  }
}

const RETURN_KEY = "audiomaxxer.returnTo.v1";

/** Remember where to send the user once they are signed in (survives OAuth redirects). */
export function rememberReturnTo(path: string | undefined) {
  try {
    if (path) storage()?.setItem(RETURN_KEY, JSON.stringify({ path, at: Date.now() }));
  } catch {
    /* best effort */
  }
}

/** Read and clear the remembered destination; stale ones (over an hour) are ignored. */
export function takeReturnTo(now = Date.now()): string | undefined {
  const s = storage();
  if (!s) return undefined;
  try {
    const raw = s.getItem(RETURN_KEY);
    s.removeItem(RETURN_KEY);
    if (!raw) return undefined;
    const { path, at } = JSON.parse(raw) as { path?: unknown; at?: unknown };
    if (typeof at !== "number" || now - at > 60 * 60 * 1000) return undefined;
    return safeReturnTo(path);
  } catch {
    return undefined;
  }
}

/** Only same-site paths are allowed as a post-sign-in destination. */
export function safeReturnTo(value: unknown): string | undefined {
  return typeof value === "string" && /^\/(?!\/)[A-Za-z0-9/_-]*$/.test(value) ? value : undefined;
}
