import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as AttributeKeysToAttributes } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Attribute-Keys-To-Attributes/Singlepage/admin-v2-table",
  component: AttributeKeysToAttributes,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof AttributeKeysToAttributes>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
