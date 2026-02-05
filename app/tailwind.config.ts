import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Masil brand colors from CLAUDE.md
        accent: "#FF6B35",
        success: "#22C55E",
      },
    },
  },
  plugins: [],
} satisfies Config;
