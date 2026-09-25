import type { Meta, StoryObj } from "@storybook/react";

import { CartDrawerDefault, defaultCartDrawerDefaultProps } from "./Component";

const meta = {
  title: "Modules/Ecommerce/Models/Cart/Singlepage/cart-drawer-default",
  component: CartDrawerDefault,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultCartDrawerDefaultProps,
} satisfies Meta<typeof CartDrawerDefault>;

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
