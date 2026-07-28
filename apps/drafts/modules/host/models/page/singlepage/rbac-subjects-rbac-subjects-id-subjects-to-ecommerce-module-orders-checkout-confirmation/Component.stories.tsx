import type { Meta, StoryObj } from "@storybook/react";

import { EcommerceOrderCheckoutConfirmationDefault } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-rbac-subjects-rbac-subjects-id-subjects-to-ecommerce-module-orders-checkout-confirmation",
  title: "Modules/Host/Models/Page/Singlepage",
  component: EcommerceOrderCheckoutConfirmationDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof EcommerceOrderCheckoutConfirmationDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/rbac/subjects/[rbac.subjects.id]/subjects-to-ecommerce-module-orders/checkout/confirmation",
};
