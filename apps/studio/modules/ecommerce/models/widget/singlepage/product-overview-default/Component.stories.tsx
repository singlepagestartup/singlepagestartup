import type { Meta, StoryObj } from "@storybook/react";
import { ProductOverviewDefaultWidget } from "./Component";

const meta = {
  title: "Modules/Ecommerce/Models/Widget/Singlepage/product-overview-default",
  component: ProductOverviewDefaultWidget,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProductOverviewDefaultWidget>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "default" };
