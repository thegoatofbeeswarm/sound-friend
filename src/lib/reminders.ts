/**
 * Local training reminders.
 *
 * The schedule lives in the database (so it follows the account), while the
 * delivery uses the browser's Notification API on the user's phone or desktop.
 * A timer fires while the app is open, and any reminder that came due while the
 * app was closed is delivered on the next visit.
 */

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export interface Schedule {
  enabled: boolean;
  days: number[]; // 0 = Sunday
  timeOfDay: string; // "HH:MM"
}

const LAST_FIRED_KEY = "audible.reminder.lastFired";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permission(): NotificationPermission | "unsupported" {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  return await Notification.requestPermission();
}

/** Next occurrence of the schedule after `from`, or null when disabled. */
export function nextRun(schedule: Schedule, from = new Date()): Date | null {
  if (!schedule.enabled || schedule.days.length === 0) return null;
  const [h, m] = schedule.timeOfDay.split(":").map((v) => Number(v));
  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(from);
    d.setDate(d.getDate() + offset);
    d.setHours(h ?? 19, m ?? 0, 0, 0);
    if (schedule.days.includes(d.getDay()) && d.getTime() > from.getTime()) return d;
  }
  return null;
}

function fire() {
  if (permission() !== "granted") return;
  new Notification("Time to train your hearing", {
    body: "A five-minute Audible session keeps your listening sharp.",
    icon: "/favicon.ico",
    tag: "audible-training",
  });
  localStorage.setItem(LAST_FIRED_KEY, String(Date.now()));
}

/**
 * Arm the reminder for this browser session. Returns a cleanup function.
 * Also delivers a reminder that became due while the app was closed.
 */
export function armReminder(schedule: Schedule): () => void {
  if (typeof window === "undefined" || !schedule.enabled) return () => {};

  // Catch-up: was a slot missed since the last delivery?
  const last = Number(localStorage.getItem(LAST_FIRED_KEY) ?? 0);
  const since = last ? new Date(last) : new Date(Date.now() - 24 * 3600 * 1000);
  const missed = nextRun(schedule, since);
  if (missed && missed.getTime() < Date.now()) fire();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    const next = nextRun(schedule);
    if (!next) return;
    // setTimeout caps around 24 days; our horizon is at most a week.
    timer = setTimeout(
      () => {
        fire();
        arm();
      },
      Math.max(1000, next.getTime() - Date.now()),
    );
  };
  arm();
  return () => clearTimeout(timer);
}

export function formatNextRun(schedule: Schedule): string {
  const next = nextRun(schedule);
  if (!next) return "No reminders scheduled";
  return next.toLocaleString(undefined, {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}
