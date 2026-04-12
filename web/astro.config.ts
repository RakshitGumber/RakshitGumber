// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

import cloudflare from "@astrojs/cloudflare";

const siteUrl = process.env.WEB_URL;

export default defineConfig({
  site: siteUrl,
  vite: {
    plugins: [tailwindcss()],
  },

  output: "static",

  integrations: [icon()],
});
