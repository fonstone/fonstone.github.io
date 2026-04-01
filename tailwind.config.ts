import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        card: "var(--color-card)",
        accent: "var(--color-accent)",
      },
      borderRadius: {
        "3xl": "1.5rem",
      },
    },
  },
} satisfies Config;

