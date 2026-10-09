import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as EcommerceModuleAttributeKey } from "../../index";

const meta = {
  title: "Modules/Ecommerce/Models/Attribute-Key/Singlepage/admin-v2-table",
  component: EcommerceModuleAttributeKey,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof EcommerceModuleAttributeKey>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
