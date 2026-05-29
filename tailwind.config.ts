import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0a1a12",
        panel: "#0f291a",
        accent: "#34d399",
        accentDark: "#059669",
        teamA: "#38bdf8",
        teamB: "#f97316",
        pitchLight: "#2d8a4e",
        pitchDark: "#248042",
        stadium: "#050d09",
        grass: "#166534",
        grassLight: "#15803d",
        netWhite: "#f0fdf4",
        cardYellow: "#fbbf24",
        cardRed: "#ef4444",
        lineWhite: "rgba(240, 253, 244, 0.92)"
      },
      fontFamily: {
        display: ["Oswald", "Arial Narrow", "sans-serif"],
        body: ["Inter", "Segoe UI", "system-ui", "sans-serif"]
      },
      boxShadow: {
        pitch: "0 0 0 1px rgba(52, 211, 153, 0.1), 0 20px 40px rgba(0, 0, 0, 0.5)",
        panel: "0 4px 24px rgba(0, 0, 0, 0.35)",
        glow: "0 0 20px rgba(52, 211, 153, 0.15)"
      }
    }
  },
  plugins: []
};

export default config;
