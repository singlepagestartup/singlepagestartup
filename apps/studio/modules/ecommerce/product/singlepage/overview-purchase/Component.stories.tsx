import { Component as Product } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProductOverviewPurchaseProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-overview-purchase",
  title: "Modules/Ecommerce/Product/Singlepage/overview-purchase",
  component: Product,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    ...defaultProductOverviewPurchaseProps,
    variant: "overview-purchase",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Product>,
    { variant: "overview-purchase" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
