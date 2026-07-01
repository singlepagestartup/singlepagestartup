import type { Meta, StoryObj } from "@storybook/react";

import { EcommerceOrderCheckoutDetailsDefault } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-ecommerce-order-checkout-details-default",
  title:
    "Modules/Host/Models/Page/Singlepage/ecommerce-order-checkout-details-default",
  component: EcommerceOrderCheckoutDetailsDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof EcommerceOrderCheckoutDetailsDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const RunnableCheckoutRoute: Story = {
  name: "/checkout",
};
