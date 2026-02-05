import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: "#F7F4EA",
          blush: "#EBD9D1",
          brown: "#B87C4C",
          sage: "#A8BBA3",
          "sage-light": "#F1F3E0",
          "sage-soft": "#D2DCB6",
          "sage-mid": "#A1BC98",
          "sage-deep": "#778873",
        },
        accent: "#B87C4C",
        success: "#A8BBA3",
      },
    },
  },
  plugins: [],
} satisfies Config;
