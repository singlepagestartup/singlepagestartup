import { Component as Attribute } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-ecommerce-models-attribute-singlepage-admin-v2-form",
  title: "Modules/Ecommerce/Attribute/Singlepage/admin-v2-form",
  component: Attribute,
  parameters: { layout: "fullscreen" },
  args: { variant: "admin-v2-form" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Attribute>, { variant: "admin-v2-form" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
