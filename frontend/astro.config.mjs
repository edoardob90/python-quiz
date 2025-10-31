// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import alpinejs from "@astrojs/alpinejs";
import node from "@astrojs/node";
import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
  integrations: [
    alpinejs(),
    expressiveCode({
      frames: {
        showCopyToClipboardButton: false,
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [".localhost", ".ngrok-free.app"],
    },
  },
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
});
