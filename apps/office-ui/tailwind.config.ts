import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0db9f2",
        "background-dark": "#101e22",
        "background-light": "#f5f8f8",
        "surface-dark": "#182d34",
        "border-dark": "#315a68",
        "accent-dark": "#223f49",
        "text-muted": "#90bccb",
        "accent-success": "#0bda57",
        "accent-warning": "#fa5f38",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        // Subtle grid dot pattern used as page background
        "grid-pattern":
          "radial-gradient(circle, rgba(13, 185, 242, 0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-40": "40px 40px",
      },
      boxShadow: {
        "glow-primary": "0 0 20px rgba(13, 185, 242, 0.15)",
        "glow-success": "0 0 10px rgba(11, 218, 87, 0.2)",
      },
      animation: {
        "success-pulse": "success-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
      keyframes: {
        "success-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(0.98)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
