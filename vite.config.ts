// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { visualizer } from "rollup-plugin-visualizer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Loads all env vars (including non-VITE_ server secrets) into process.env for server routes.
const serverEnv = loadEnv(process.env["NODE_ENV"] ?? "development", process.cwd(), "");
Object.assign(process.env, serverEnv);

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // `ANALYZE=1 bun run build` writes a bundle treemap (stats.html) into each build's output
    // folder; ANALYZE=json writes raw stats.json instead. Off by default.
    plugins: process.env["ANALYZE"]
      ? [
          // One report per build (client, SSR, server), written next to that build's output.
          visualizer({
            emitFile: true,
            filename: process.env["ANALYZE"] === "json" ? "stats.json" : "stats.html",
            template: process.env["ANALYZE"] === "json" ? "raw-data" : "treemap",
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : [],
    resolve: {
      alias: {
        "entities/lib/decode.js": path.resolve(__dirname, "node_modules/entities/lib/esm/decode.js"),
        "entities/lib/escape.js": path.resolve(__dirname, "node_modules/entities/lib/esm/escape.js"),
        "entities/lib/encode.js": path.resolve(__dirname, "node_modules/entities/lib/esm/encode.js"),
        "entities/decode": path.resolve(__dirname, "node_modules/entities/lib/esm/decode.js"),
        "entities/escape": path.resolve(__dirname, "node_modules/entities/lib/esm/escape.js"),
        entities: path.resolve(__dirname, "node_modules/entities/lib/esm/index.js"),
      },
    },
  },
});
