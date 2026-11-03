/** @type {import('tailwindcss').Config} */
// Palette logic: two MOOD colours (forest green + rice-paper cream) set the
// feeling; ONE ACCENT (gurans, the rhododendron) sets the personality.
// The accent (marigold) is never used for money amounts or status: income/expense keep functional colours.
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5EFE0",
        card: "#FFFDF8",
        line: "#E4DAC4",
        ink: { DEFAULT: "#0A2A20", soft: "#3A5148", mute: "#5C6C63" },
        forest: { DEFAULT: "#0B3326", deep: "#06241B" },
        brand: { DEFAULT: "#11694B", dark: "#0C4F38", tint: "#DCEBDD" },
        accent: { DEFAULT: "#FFB400", dark: "#E69E00", tint: "#FFF1CC" },
        signal: "#B8361A",
        warn: { DEFAULT: "#C8702A", dark: "#8A4410" },
        // readable tones for money-direction text on the dark forest surfaces
        mint: "#8FE3B4",
        coral: "#FF9B7E",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Geist"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Geist"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 0 0 1px rgba(10,42,32,.07), 0 1px 2px rgba(10,42,32,.04)",
        lift: "0 0 0 1px rgba(10,42,32,.07), 0 18px 40px -18px rgba(10,42,32,.35)",
      },
      maxWidth: { wrap: "1560px" },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        spin: { to: { transform: "rotate(360deg)" } },
      },
      animation: { rise: "rise .35s ease-out both", "spin-slow": "spin 40s linear infinite" },
    },
  },
  plugins: [],
};
