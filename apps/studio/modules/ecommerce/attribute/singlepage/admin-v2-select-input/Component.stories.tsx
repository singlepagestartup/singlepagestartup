import type { Meta, StoryObj } from "@storybook/react";
import { EcommerceAttributeAdminV2SelectInput } from "./Component";
const meta = {
  id: "modules-ecommerce-models-attribute-singlepage-admin-v2-select-input",
  title: "Modules/Ecommerce/Models/Attribute/Singlepage/admin-v2-select-input",
  component: EcommerceAttributeAdminV2SelectInput,
  parameters: { layout: "centered" },
} satisfies Meta<typeof EcommerceAttributeAdminV2SelectInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
