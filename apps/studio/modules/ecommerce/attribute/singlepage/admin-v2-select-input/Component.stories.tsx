import { Component as Attribute } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-ecommerce-models-attribute-singlepage-admin-v2-select-input",
  title: "Modules/Ecommerce/Attribute/Singlepage/admin-v2-select-input",
  component: Attribute,
  parameters: { layout: "centered" },
  args: { variant: "admin-v2-select-input" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Attribute>,
    { variant: "admin-v2-select-input" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
