import { Component as Order } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultOrderSummaryDefaultProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-order-singlepage-order-summary-default",
  title: "Modules/Ecommerce/Order/Singlepage/order-summary-default",
  component: Order,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultOrderSummaryDefaultProps, variant: "summary-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Order>, { variant: "summary-default" }>
>;

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
