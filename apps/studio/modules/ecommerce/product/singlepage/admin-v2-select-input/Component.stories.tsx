import type { Meta, StoryObj } from "@storybook/react";
import { EcommerceProductAdminV2SelectInput } from "./Component";
const meta = {
  id: "modules-ecommerce-models-product-singlepage-admin-v2-select-input",
  title: "Modules/Ecommerce/Models/Product/Singlepage/admin-v2-select-input",
  component: EcommerceProductAdminV2SelectInput,
  parameters: { layout: "centered" },
} satisfies Meta<typeof EcommerceProductAdminV2SelectInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
