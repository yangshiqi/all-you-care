import type { Config } from "tailwindcss";

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
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography")
  ],
} satisfies Config;
