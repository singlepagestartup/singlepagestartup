import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProductFindTiersProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-widget-singlepage-product-find-tiers",
  title: "Modules/Ecommerce/Widget/Singlepage/product-find-tiers",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: { ...defaultProductFindTiersProps, variant: "product-find-tiers" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "product-find-tiers" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
