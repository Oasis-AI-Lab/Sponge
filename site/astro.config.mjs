import { defineConfig } from "astro/config";

export default defineConfig({
  i18n: {
    locales: ["en", "zh"],
    defaultLocale: "en",
    routing: { prefixDefaultLocale: false },
  },
});
