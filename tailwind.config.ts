import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0d1f1a",
        panel: "#123126",
        accent: "#ffd166",
        teamA: "#64d2ff",
        teamB: "#ff7f50",
        pitchLight: "#3d9d52",
        pitchDark: "#338747"
      }
    }
  },
  plugins: []
};

export default config;
