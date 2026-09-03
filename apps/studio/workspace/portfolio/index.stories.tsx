import type { Meta, StoryObj } from "@storybook/react-vite";

import { PortfolioCatalog } from "../components/PortfolioCatalog";
import { portfolioCatalogViews } from "./source";

const meta = {
  title: "Workspace/00 Business/02 Portfolio",
  component: PortfolioCatalog,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { view: portfolioCatalogViews.default },
} satisfies Meta<typeof PortfolioCatalog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "default" };
export const Singlepage: Story = {
  name: "singlepage",
  args: { view: portfolioCatalogViews.singlepage },
};
export const Startup: Story = {
  name: "startup",
  args: { view: portfolioCatalogViews.startup },
};
