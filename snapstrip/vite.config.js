import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";

// Keep the CDN-hosted MediaPipe WASM runtime in sync with the
// installed @mediapipe/tasks-vision version.
const mediapipeVersion = JSON.parse(
  readFileSync(
    new URL(
      "./node_modules/@mediapipe/tasks-vision/package.json",
      import.meta.url
    ),
    "utf-8"
  )
).version;

export default defineConfig({
  define: {
    __MP_VERSION__: JSON.stringify(mediapipeVersion),
  },

  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "SnapStrip",
        short_name: "SnapStrip",
        description: "Your personal browser-based photobooth.",
        theme_color: "#111111",
        background_color: "#fafafa",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});