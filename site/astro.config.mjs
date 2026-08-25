import { defineConfig } from "astro/config";

export default defineConfig({
  base: process.env.SITE_BASE || "/",
  i18n: {
    locales: ["en", "zh"],
    defaultLocale: "en",
    routing: { prefixDefaultLocale: false },
  },
});
