import type { Meta, StoryObj } from "@storybook/react";

import {
  OrderSummaryDefault,
  defaultOrderSummaryDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/Ecommerce/Models/Order/Singlepage/order-summary-default",
  component: OrderSummaryDefault,
  parameters: {
    layout: "padded",
  },
  args: defaultOrderSummaryDefaultProps,
} satisfies Meta<typeof OrderSummaryDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const Compact: Story = {
  name: "compact",
  args: {
    compact: true,
    editable: false,
  },
};
