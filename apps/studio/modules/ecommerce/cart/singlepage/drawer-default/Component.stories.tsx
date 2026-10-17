import { Component as Cart } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultCartDrawerDefaultProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-cart-singlepage-cart-drawer-default",
  title: "Modules/Ecommerce/Cart/Singlepage/cart-drawer-default",
  component: Cart,
  parameters: {
    layout: "fullscreen",
  },
  args: { ...defaultCartDrawerDefaultProps, variant: "drawer-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Cart>, { variant: "drawer-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const Empty: Story = {
  name: "empty",
  args: {
    items: [],
  },
};
