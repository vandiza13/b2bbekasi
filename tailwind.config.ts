import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-jakarta)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        navy: {
          950: "#07111f",
          900: "#0b1728",
          800: "#10213a",
          700: "#17304f",
        },
      },
      boxShadow: {
        soft: "0 12px 40px -8px rgba(15, 23, 42, 0.08)",
        card: "0 1px 2px rgba(15, 23, 42, 0.03), 0 8px 28px -6px rgba(15, 23, 42, 0.06)",
        lift: "0 2px 4px rgba(15, 23, 42, 0.04), 0 16px 40px -8px rgba(15, 23, 42, 0.12)",
        overlay: "0 24px 70px -12px rgba(15, 23, 42, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
