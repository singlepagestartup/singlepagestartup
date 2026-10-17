import { Component as Product } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProductOverviewDefaultProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-overview-default",
  title: "Modules/Ecommerce/Product/Singlepage/overview-default",
  component: Product,
  parameters: {
    layout: "fullscreen",
  },
  args: { ...defaultProductOverviewDefaultProps, variant: "overview-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Product>, { variant: "overview-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
