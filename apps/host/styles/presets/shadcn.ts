import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";
import { Config } from "tailwindcss";
import typographyPlugin from "@tailwindcss/typography";
import aspectRatioPlugin from "@tailwindcss/aspect-ratio";

const shadcnPlugin = plugin(
  function ({ addBase }) {
    addBase({
      ":root": {
        "--background": "0.000000 0.000000% 100.000000%",
        "--foreground": "203.333333 27.272727% 12.941176%",
        "--muted": "210.000000 22.222222% 96.470588%",
        "--muted-foreground": "202.857143 10.344828% 39.803922%",
        "--popover": "0.000000 0.000000% 100.000000%",
        "--popover-foreground": "203.333333 27.272727% 12.941176%",
        "--border": "204.000000 16.666667% 88.235294%",
        "--input": "204.000000 16.666667% 88.235294%",
        "--card": "0.000000 0.000000% 100.000000%",
        "--card-foreground": "203.333333 27.272727% 12.941176%",
        "--primary": "80.281690 81.609195% 65.882353%",
        "--primary-foreground": "203.333333 27.272727% 12.941176%",
        "--secondary": "210.000000 22.222222% 96.470588%",
        "--secondary-foreground": "203.333333 27.272727% 12.941176%",
        "--accent": "210.000000 22.222222% 96.470588%",
        "--accent-foreground": "203.333333 27.272727% 12.941176%",
        "--destructive": "351.310345 67.441860% 42.156863%",
        "--destructive-foreground": "0.000000 0.000000% 100.000000%",
        "--ring": "203.333333 27.272727% 12.941176%",
        "--default": "203.333333 27.272727% 12.941176%",
        "--default-foreground": "0.000000 0.000000% 100.000000%",
        "--default-muted-foreground": "204.000000 14.563107% 79.803922%",
        "--destructive-surface": "351.428571 100.000000% 97.254902%",
        "--destructive-border": "349.811321 54.639175% 80.980392%",
        "--radius": "0.5rem",
      },
      ".dark": {
        "--default": "213 31% 91%",
        "--default-foreground": "224 71% 4%",
        "--default-muted-foreground": "215.4 16.3% 46.9%",
        "--destructive-surface": "0 63% 12%",
        "--destructive-border": "0 63% 31%",
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
          default: {
            DEFAULT: "hsl(var(--default))",
            foreground: "hsl(var(--default-foreground))",
            "muted-foreground": "hsl(var(--default-muted-foreground))",
          },
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            surface: "hsl(var(--destructive-surface))",
            border: "hsl(var(--destructive-border))",
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
          sans: ["var(--font-default)", ...defaultTheme.fontFamily.sans],
          default: ["var(--font-default)", ...defaultTheme.fontFamily.sans],
          primary: ["var(--font-primary)", ...defaultTheme.fontFamily.sans],
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
  darkMode: "class",
  content: [],
  plugins: [typographyPlugin, aspectRatioPlugin, shadcnPlugin],
} satisfies Config;
