import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

// Tailwind v4 uses CSS-first configuration via @theme in globals.css.
// This file is kept minimal for content detection and plugins that might rely on it.
export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  // Theme configuration has been migrated to src/app/globals.css
  plugins: [
    tailwindcssAnimate,
    typography,
  ],
} satisfies Config;
