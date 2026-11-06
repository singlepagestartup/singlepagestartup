import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as AttributeKey } from "../../index";

const meta = {
  id: "modules-ecommerce-models-attribute-key-singlepage-admin-v2-table",
  title: "Modules/Ecommerce/Attribute-Key/Singlepage/admin-v2-table",
  component: AttributeKey,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof AttributeKey>,
    { variant: "admin-v2-table" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
