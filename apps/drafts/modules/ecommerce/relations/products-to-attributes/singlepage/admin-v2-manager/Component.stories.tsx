import type { Meta, StoryObj } from "@storybook/react";

import { EcommerceProductsToAttributesAdminV2Manager } from "./Component";

const meta = {
  id: "modules-ecommerce-relations-products-to-attributes-singlepage-admin-v2-manager",
  title:
    "Modules/Ecommerce/Relations/Products To Attributes/Singlepage/admin-v2-manager",
  component: EcommerceProductsToAttributesAdminV2Manager,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof EcommerceProductsToAttributesAdminV2Manager>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
