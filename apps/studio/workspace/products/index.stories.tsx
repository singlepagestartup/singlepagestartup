import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProductCatalog } from "../components/ProductCatalog";
import { productCatalogViews } from "./source";

const meta = {
  title: "Workspace/40 Products",
  component: ProductCatalog,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { view: productCatalogViews.default },
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
