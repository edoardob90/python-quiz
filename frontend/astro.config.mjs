// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import alpinejs from "@astrojs/alpinejs";
import node from "@astrojs/node";
import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
  integrations: [
    alpinejs({ entrypoint: '/src/lib/alpine/alpineInit' }),
    expressiveCode({
      frames: {
        showCopyToClipboardButton: false,
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@components': '/src/components',
        '@layouts': '/src/layouts',
        '@lib': '/src/lib',
        '@styles': '/src/styles',
        '@content': '/src/content',
      },
    },
  },
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
});
