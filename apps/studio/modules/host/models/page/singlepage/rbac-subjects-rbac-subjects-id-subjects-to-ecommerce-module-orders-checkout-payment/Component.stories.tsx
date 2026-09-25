import type { Meta, StoryObj } from "@storybook/react";

import { EcommerceOrderCheckoutPaymentDefault } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-rbac-subjects-rbac-subjects-id-subjects-to-ecommerce-module-orders-checkout-payment",
  title: "Modules/Host/Models/Page/Singlepage",
  component: EcommerceOrderCheckoutPaymentDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof EcommerceOrderCheckoutPaymentDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/rbac/subjects/[rbac.subjects.id]/subjects-to-ecommerce-module-orders/checkout/payment",
};
