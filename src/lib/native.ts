/**
 * Browser-safe helpers for the Capacitor native shell.
 * Every Capacitor module is imported dynamically so SSR and the plain web
 * build never touch native code.
 */

export type NativePlatform = "ios" | "android" | "web";

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export function nativePlatform(): NativePlatform {
  if (typeof window === "undefined") return "web";
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const platform = cap?.getPlatform?.() ?? "web";
  return platform === "ios" || platform === "android" ? platform : "web";
}

/** Configure status bar, hide the splash screen, and wire hardware back button. */
export async function initNativeShell(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    const isDark = document.documentElement.classList.contains("dark");
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    if (nativePlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: isDark ? "#0b0f14" : "#ffffff" });
    }
  } catch {
    /* status bar unavailable */
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* splash unavailable */
  }

  try {
    const { App } = await import("@capacitor/app");
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else void App.exitApp();
    });
  } catch {
    /* app plugin unavailable */
  }

  document.documentElement.classList.add("native-app", `native-${nativePlatform()}`);
}

/** Light tap feedback for screening responses; silently no-ops on web. */
export async function tapFeedback(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* haptics unavailable */
  }
}

/** Ask for notification permission (used by reminders on native). */
export async function requestNativeNotifications(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const result = await LocalNotifications.requestPermissions();
    return result.display === "granted";
  } catch {
    return false;
  }
}

/** Schedule a repeating daily reminder at the given local hour/minute. */
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  title = "Audiomaxxer",
  body = "Time for today's hearing training.",
): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const granted = await requestNativeNotifications();
    if (!granted) return false;
    await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1001,
          title,
          body,
          schedule: { on: { hour, minute }, allowWhileIdle: true },
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelDailyReminder(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
  } catch {
    /* ignore */
  }
}
