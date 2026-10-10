import type { Meta, StoryObj } from "@storybook/react";

import {
  OrderCheckoutStepperDefault,
  defaultOrderCheckoutStepperDefaultProps,
} from "./Component";

const meta = {
  title:
    "Modules/Ecommerce/Models/Order/Singlepage/order-checkout-stepper-default",
  component: OrderCheckoutStepperDefault,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultOrderCheckoutStepperDefaultProps,
} satisfies Meta<typeof OrderCheckoutStepperDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const Payment: Story = {
  name: "payment",
  args: {
    currentStep: "payment",
  },
};

export const Confirmation: Story = {
  name: "confirmation",
  args: {
    currentStep: "confirmation",
  },
};
