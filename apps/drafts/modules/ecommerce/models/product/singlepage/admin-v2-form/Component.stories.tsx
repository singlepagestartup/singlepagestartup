import type { Meta, StoryObj } from "@storybook/react";

import { EcommerceProductAdminV2Form } from "./Component";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-admin-v2-form",
  title: "Modules/Ecommerce/Models/Product/Singlepage",
  component: EcommerceProductAdminV2Form,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof EcommerceProductAdminV2Form>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "admin-v2-form",
};
