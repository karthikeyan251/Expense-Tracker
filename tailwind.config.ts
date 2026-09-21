import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        slate: {
          850: "#131E32",
          900: "#0F172A",
          950: "#080D1A",
        },
        emerald: {
          500: "#10B981",
          600: "#059669",
        },
        indigo: {
          600: "#4F46E5",
          700: "#4338CA",
        },
        coral: {
          500: "#EF4444",
          600: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
