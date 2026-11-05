import { Component as Cart } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultCartButtonDefaultProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-cart-singlepage-cart-button-default",
  title: "Modules/Ecommerce/Cart/Singlepage/cart-button-default",
  component: Cart,
  parameters: {
    layout: "centered",
  },
  args: { ...defaultCartButtonDefaultProps, variant: "button-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Cart>, { variant: "button-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
