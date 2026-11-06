import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-ecommerce-models-widget-singlepage-product-overview-default",
  title: "Modules/Ecommerce/Widget/Singlepage/product-overview-default",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { variant: "product-overview-default" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "product-overview-default" }
  >
>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "default" };
