import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProductCatalog } from "../components/ProductCatalog";
import { productCatalogViews } from "../products/source";

const meta = {
  id: "workspace-40-products",
  title: "Workspace/40 Products/Legacy catalog",
  tags: ["!dev", "!test"],
  component: ProductCatalog,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { view: productCatalogViews.default },
  render: (args) => (
    <ProductCatalog
      {...args}
      productId={
        typeof window === "undefined"
          ? undefined
          : (new URLSearchParams(window.location.search).get("product") ??
            undefined)
      }
    />
  ),
} satisfies Meta<typeof ProductCatalog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "default" };
export const Singlepage: Story = {
  name: "singlepage",
  args: { view: productCatalogViews.singlepage },
};
export const Startup: Story = {
  name: "startup",
  args: { view: productCatalogViews.startup },
};
