import type { Meta, StoryObj } from "@storybook/react";

import {
  OrderCheckoutConfirmationDefault,
  defaultOrderCheckoutConfirmationDefaultProps,
} from "./Component";

const meta = {
  title:
    "Modules/Ecommerce/Models/Order/Singlepage/order-checkout-confirmation-default",
  component: OrderCheckoutConfirmationDefault,
  parameters: {
    layout: "padded",
  },
  args: defaultOrderCheckoutConfirmationDefaultProps,
} satisfies Meta<typeof OrderCheckoutConfirmationDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
