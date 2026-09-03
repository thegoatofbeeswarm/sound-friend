import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Audiomaxxer native shell (iOS + Android).
 *
 * The app is server-rendered, so the native shell loads the published site
 * instead of a static bundle. Swap `server.url` for a local IP (e.g.
 * http://192.168.1.20:8080) while developing against the dev server.
 */
const config: CapacitorConfig = {
  appId: "app.audiomaxxer",
  appName: "Audiomaxxer",
  webDir: "public",
  server: {
    url: "https://audiomaxxer.app",
    cleartext: false,
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#ffffff",
  },
  android: {
    backgroundColor: "#ffffff",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
    },
  },
};

export default config;
