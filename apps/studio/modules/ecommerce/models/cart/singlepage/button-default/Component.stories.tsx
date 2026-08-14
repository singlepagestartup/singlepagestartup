import type { Meta, StoryObj } from "@storybook/react";

import { CartButtonDefault, defaultCartButtonDefaultProps } from "./Component";

const meta = {
  title: "Modules/Ecommerce/Models/Cart/Singlepage/cart-button-default",
  component: CartButtonDefault,
  parameters: {
    layout: "centered",
  },
  args: defaultCartButtonDefaultProps,
} satisfies Meta<typeof CartButtonDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
