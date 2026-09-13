import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/postcss";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncProductStories } from "../../../tools/studio/products/stories";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(configDirectory, "../workspace");
const generatedProducts = path.join(configDirectory, ".generated/products");
const refreshProducts = () => syncProductStories(workspace, generatedProducts);
refreshProducts();

const config: StorybookConfig = {
  stories: [
    "../modules/**/*.stories.@(ts|tsx|mdx)",
    "../workspace/utils/stories/*.stories.@(ts|tsx|mdx)",
    "./.generated/products/*.stories.tsx",
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
    plugins: [
      ...(config.plugins ?? []),
      {
        name: "sps-product-stories",
        configureServer(server) {
          const catalogs = ["singlepage", "startup"].map((layer) =>
            path.join(workspace, "products", layer, "catalog.yaml"),
          );
          server.watcher.add(catalogs);
          const refresh = (file: string) => {
            if (!catalogs.includes(file)) return;
            try {
              refreshProducts();
            } catch (error) {
              server.config.logger.error(String(error));
            }
          };
          server.watcher.on("change", refresh);
          server.watcher.on("add", refresh);
          server.httpServer?.once("close", () => {
            server.watcher.off("change", refresh);
            server.watcher.off("add", refresh);
          });
        },
      },
    ],
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
