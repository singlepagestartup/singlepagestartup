import { Component as Product } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProductOverviewCtaProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-overview-cta",
  title: "Modules/Ecommerce/Product/Singlepage/overview-cta",
  component: Product,
  parameters: {
    layout: "fullscreen",
  },
  args: { ...defaultProductOverviewCtaProps, variant: "overview-cta" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Product>, { variant: "overview-cta" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
