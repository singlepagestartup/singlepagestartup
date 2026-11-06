import { Component as Order } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultOrderCheckoutStepperDefaultProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-order-singlepage-order-checkout-stepper-default",
  title: "Modules/Ecommerce/Order/Singlepage/order-checkout-stepper-default",
  component: Order,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    ...defaultOrderCheckoutStepperDefaultProps,
    variant: "checkout-stepper-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Order>,
    { variant: "checkout-stepper-default" }
  >
>;

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
