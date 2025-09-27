import { fontFamily } from "tailwindcss/defaultTheme";
import colors from "tailwindcss/colors";
import plugin from "tailwindcss/plugin";
import { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";
import typographyPlugin from "@tailwindcss/typography";
import aspectRatioPlugin from "@tailwindcss/aspect-ratio";

const shadcnPlugin = plugin(
  function ({ addBase }) {
    addBase({
      ":root": {
        "--background": "0 0% 100%",
        "--foreground": "222.2 47.4% 11.2%",
        "--muted": "210 40% 96.1%",
        "--muted-foreground": "215.4 16.3% 46.9%",
        "--popover": "0 0% 100%",
        "--popover-foreground": "222.2 47.4% 11.2%",
        "--border": "214.3 31.8% 91.4%",
        "--input": "214.3 31.8% 91.4%",
        "--card": "0 0% 100%",
        "--card-foreground": "222.2 47.4% 11.2%",
        "--primary": "222.2 47.4% 11.2%",
        "--primary-foreground": "210 40% 98%",
        "--secondary": "210 40% 96.1%",
        "--secondary-foreground": "222.2 47.4% 11.2%",
        "--accent": "210 40% 96.1%",
        "--accent-foreground": "222.2 47.4% 11.2%",
        "--destructive": "0 100% 50%",
        "--destructive-foreground": "210 40% 98%",
        "--ring": "215 20.2% 65.1%",
        "--radius": "0.5rem",
      },
      ".dark": {
        "--background": "224 71% 4%",
        "--foreground": "213 31% 91%",
        "--muted": "223 47% 11%",
        "--muted-foreground": "215.4 16.3% 56.9%",
        "--accent": "216 34% 17%",
        "--accent-foreground": "210 40% 98%",
        "--popover": "224 71% 4%",
        "--popover-foreground": "215 20.2% 65.1%",
        "--border": "216 34% 17%",
        "--input": "216 34% 17%",
        "--card": "224 71% 4%",
        "--card-foreground": "213 31% 91%",
        "--primary": "210 40% 98%",
        "--primary-foreground": "222.2 47.4% 1.2%",
        "--secondary": "222.2 47.4% 11.2%",
        "--secondary-foreground": "210 40% 98%",
        "--destructive": "0 63% 31%",
        "--destructive-foreground": "210 40% 98%",
        "--ring": "216 34% 17%",
        "--radius": "0.5rem",
      },
    });

    addBase({
      "*": {
        "@apply border-border": {},
      },
      body: {
        "@apply bg-background text-foreground": {},
        "font-feature-settings": '"rlig" 1, "calt" 1',
      },
    });
  },
  {
    theme: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      extend: {
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
            50: colors.indigo[50],
            300: colors.indigo[300],
            400: colors.indigo[400],
            500: colors.indigo[500],
            600: colors.indigo[600],
            700: colors.indigo[700],
            900: colors.indigo[900],
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
        },
        backgroundImage: {
          "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        transitionProperty: {
          width: "width",
        },
        fontFamily: {
          sans: ["var(--font-sans)", ...fontFamily.sans],
          default: ["var(--font-default)", ...fontFamily.sans],
          primary: ["var(--font-primary)", ...fontFamily.sans],
        },
        keyframes: {
          "accordion-down": {
            from: { height: "0" },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          "accordion-up": {
            from: { height: "var(--radix-accordion-content-height)" },
            to: { height: "0" },
          },
        },
        animation: {
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
        },
      },
    },
  },
);

export const preset = {
  darkMode: ["class"],
  content: [],
  safelist: [
    // Save all paddings
    { pattern: /^p\w?-/, variants: ["sm", "md", "lg", "xl", "2xl"] },
    // Save all margins
    { pattern: /^m\w?-/, variants: ["sm", "md", "lg", "xl", "2xl"] },
    // Save all widhts
    { pattern: /^w\w?-/, variants: ["sm", "md", "lg", "xl", "2xl"] },
    // Save all heights
    { pattern: /^h\w?-/, variants: ["sm", "md", "lg", "xl", "2xl"] },
    // Save all text sizes
    { pattern: /^text-\w?/, variants: ["sm", "md", "lg", "xl", "2xl"] },
    { pattern: /grid-cols-(1|2|3|4|5|6|7|8|9|10|11|12)/ },
    { pattern: /col-span-(1|2|3|4|5|6|7|8|9|10|11|12)/ },
    {
      pattern: /aspect-w-(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20)/,
      variants: ["sm", "md", "lg", "xl"],
    },
    {
      pattern: /aspect-h-(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20)/,
      variants: ["sm", "md", "lg", "xl"],
    },
    {
      pattern: /font-(default|primary)/,
      variants: ["sm", "md", "lg", "xl", "2xl"],
    },
    // Save object fit
    {
      pattern: /object-(cover|contain)/,
    },
    {
      pattern: /col-span-(1|2|3|4|5|6|7|8|9|10|11|12)/,
      variants: ["sm", "md", "lg", "xl", "2xl"],
    },
    {
      pattern: /max-w-\w?/,
    },
  ],
  plugins: [typographyPlugin, aspectRatioPlugin, animatePlugin, shadcnPlugin],
} satisfies Config;
