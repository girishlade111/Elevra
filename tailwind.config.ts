import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d0d0d",
        panel: "#161616",
        surface: {
          DEFAULT: "#161616",
          secondary: "#1c1c1c",
          hover: "#242424",
        },
        border: {
          DEFAULT: "#2a2a2a",
        },
        text: {
          primary: "#e8e8e8",
          secondary: "#8a8a8a",
          muted: "#5c5c5c",
        },
        accent: {
          DEFAULT: "#e07856",
          hover: "#cf6a49",
          foreground: "#0d0d0d",
        },
        success: {
          DEFAULT: "#3ecf5e",
          foreground: "#0d0d0d",
        },
        danger: {
          DEFAULT: "#e5484d",
          foreground: "#ffffff",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        "table-header": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "section-label": ["12.5px", { lineHeight: "16px", fontWeight: "500" }],
        description: ["12.5px", { lineHeight: "18px" }],
        body: ["13.5px", { lineHeight: "20px" }],
        "field-label": ["13.5px", { lineHeight: "18px", fontWeight: "500" }],
        h1: ["22px", { lineHeight: "28px", fontWeight: "600" }],
        h2: ["18px", { lineHeight: "24px", fontWeight: "600" }],
        h3: ["15px", { lineHeight: "20px", fontWeight: "600" }],
      },
      spacing: {
        sidebar: "260px",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
