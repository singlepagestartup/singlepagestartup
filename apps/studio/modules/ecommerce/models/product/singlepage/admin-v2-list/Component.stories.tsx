import type { Meta, StoryObj } from "@storybook/react";

import { EcommerceProductAdminV2List } from "./Component";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-admin-v2-list",
  title: "Modules/Ecommerce/Models/Product/Singlepage/admin-v2-list",
  component: EcommerceProductAdminV2List,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof EcommerceProductAdminV2List>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
