import type { Meta, StoryObj } from "@storybook/react";
import { EcommerceAttributeAdminV2Form } from "./Component";
const meta = {
  id: "modules-ecommerce-models-attribute-singlepage-admin-v2-form",
  title: "Modules/Ecommerce/Models/Attribute/Singlepage/admin-v2-form",
  component: EcommerceAttributeAdminV2Form,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof EcommerceAttributeAdminV2Form>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
