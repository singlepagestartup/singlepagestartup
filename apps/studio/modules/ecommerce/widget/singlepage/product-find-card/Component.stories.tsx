import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";
import { defaultProductFindCardProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-widget-singlepage-product-find-card",
  title: "Modules/Ecommerce/Widget/Singlepage/product-find-card",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { ...defaultProductFindCardProps, variant: "product-find-card" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "product-find-card" }>
>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  name: "default",
};
