import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/postcss";

const config: StorybookConfig = {
  stories: [
    "../modules/**/*.stories.@(ts|tsx|mdx)",
    "../workspace/utils/stories/*.stories.@(ts|tsx|mdx)",
  ],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: [
    "../runtime",
    "../foundations",
    { from: "../workspace/assets", to: "/workspace-assets" },
    { from: "../workspace/products", to: "/workspace-products" },
    { from: "../workspace/design", to: "/workspace-design" },
  ],
  viteFinal: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      tsconfigPaths: true,
    },
    css: {
      ...config.css,
      postcss: {
        plugins: [tailwindcss()],
      },
    },
  }),
};

export default config;
