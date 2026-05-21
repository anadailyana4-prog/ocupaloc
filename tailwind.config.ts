import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        /* ═══════════════════════════════════════════════════════════════
           PALETA PSIHOLOGICĂ OCUPALOC v2.0
           ═══════════════════════════════════════════════════════════════ */
        oc: {
          cream: "#FAF9F7",
          "cream-dark": "#F5F3EE",
          teal: "#0D9488",
          "teal-dark": "#0F766E",
          "teal-soft": "#E6F4F3",
          amber: "#D97706",
          "amber-light": "#F59E0B",
          "amber-soft": "#FEF7E8",
          slate: "#0F172A",
          "slate-light": "#1E293B",
          muted: "#64748B",
          border: "#E2E8F0",
          rose: "#E11D48",
          "rose-soft": "#FCE7F0",
          success: "#059669",
          "success-soft": "#D1FAE5",
          warning: "#B45309"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        oc: "8px"
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-cormorant)", "Georgia", "serif"]
      },
      boxShadow: {
        oc: "0 1px 2px rgba(0, 0, 0, 0.04)"
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
