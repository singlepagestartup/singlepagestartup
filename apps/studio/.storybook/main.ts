import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/postcss";

const config: StorybookConfig = {
  stories: [
    "../modules/**/*.stories.@(ts|tsx|mdx)",
    "../workspace/**/*.stories.@(ts|tsx|mdx)",
  ],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["../runtime", "../foundations"],
  viteFinal: (config) => ({
    ...config,
    css: {
      ...config.css,
      postcss: {
        plugins: [tailwindcss()],
      },
    },
  }),
};

export default config;
