import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-quicksand)", "ui-rounded", "system-ui", "sans-serif"],
        display: ["var(--font-baloo)", "var(--font-quicksand)", "sans-serif"],
      },
      colors: {
        // lavender / periwinkle dream palette
        cream: "#FBFAFF",
        lav: {
          50: "#F6F4FF",
          100: "#ECE9FF",
          200: "#DCD6FF",
          300: "#C7BCFF",
          400: "#AE9DFF",
          500: "#9B86FF",
          600: "#8C9EFF", // periwinkle
          700: "#7B6CF0",
          800: "#5F51C4",
          900: "#463B8F",
        },
        ink: "#4A4063",
        inkSoft: "#7A6F96",
        blush: "#FFC6E0",
        mint: "#B8F1D9",
        butter: "#FFE9A8",
      },
      boxShadow: {
        cute: "0 10px 30px -12px rgba(123,108,240,0.45)",
        soft: "0 6px 20px -8px rgba(123,108,240,0.30)",
        pop: "0 4px 0 0 rgba(123,108,240,0.35)",
      },
      borderRadius: {
        blob: "2rem",
        bubble: "1.4rem",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(4deg)" },
        },
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "70%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%,100%": { transform: "translate(0,0) rotate(0)" },
          "15%": { transform: "translate(-10px,4px) rotate(-2deg)" },
          "30%": { transform: "translate(10px,-6px) rotate(2deg)" },
          "45%": { transform: "translate(-12px,-4px) rotate(-2deg)" },
          "60%": { transform: "translate(12px,6px) rotate(2deg)" },
          "75%": { transform: "translate(-8px,4px) rotate(-1deg)" },
        },
        heartbeat: {
          "0%,100%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.18)" },
          "40%": { transform: "scale(0.98)" },
          "60%": { transform: "scale(1.12)" },
        },
        bouncedot: {
          "0%,80%,100%": { transform: "translateY(0)", opacity: "0.5" },
          "40%": { transform: "translateY(-6px)", opacity: "1" },
        },
        sparkle: {
          "0%,100%": { opacity: "0.3", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        wiggle: "wiggle 0.6s ease-in-out infinite",
        pop: "pop 0.35s cubic-bezier(.2,1.4,.4,1) both",
        shake: "shake 0.6s ease-in-out",
        heartbeat: "heartbeat 0.9s ease-in-out",
        bouncedot: "bouncedot 1.2s ease-in-out infinite",
        sparkle: "sparkle 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
