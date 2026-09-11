import type { Meta, StoryObj } from "@storybook/react-vite";
import { stringify } from "yaml";
import { ProductCatalog } from "../../../../apps/studio/workspace/utils/components/ProductCatalog";
import { parseProductCatalog } from "../../../../apps/studio/workspace/utils/products/catalog";
import { resolveProductSections } from "../../../../apps/studio/workspace/utils/products/pages";
import { productCatalogViews } from "../../../../apps/studio/workspace/utils/products/source";
import { extensionProduct } from "./catalog";

const catalog = parseProductCatalog(
  stringify({
    schema: "singlepagestartup.product-catalog.v1",
    products: [extensionProduct],
  }),
  "startup",
);
const components = import.meta.glob<{ default?: React.ComponentType }>(
  "./startup/**/*.{tsx,jsx}",
  { eager: true },
);
const markdown = import.meta.glob<string>("./startup/**/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});
const files = import.meta.glob("./startup/**/*", {
  query: "?url",
  import: "default",
});
const keys = <T,>(value: Record<string, T>) =>
  Object.fromEntries(
    Object.entries(value).map(([key, source]) => [key.slice(2), source]),
  );
const sections = resolveProductSections(
  catalog.products[0].sections,
  "startup",
  {
    components: keys(components),
    markdown: keys(markdown),
    files: new Set(Object.keys(keys(files))),
  },
);
const base = productCatalogViews.singlepage.products[0];
const meta = {
  title: "Verification/Product extensions",
  component: ProductCatalog,
  parameters: { layout: "fullscreen" },
  args: {
    view: {
      ...productCatalogViews.startup,
      products: [
        { ...base, id: "example", name: "Extension fixture", sections },
      ],
    },
  },
} satisfies Meta<typeof ProductCatalog>;
export default meta;
export const NestedPages: StoryObj<typeof meta> = {};
