import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as AttributeKey } from "../../index";
const meta = {
  id: "modules-social-models-attribute-key-singlepage-list",
  title: "Modules/Social/Attribute-Key/Singlepage/list",
  component: AttributeKey,
  args: { variant: "list", count: 3, empty: false },
  argTypes: {
    count: { control: { type: "number", min: 0, max: 50 } },
    empty: { control: "boolean" },
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof AttributeKey>, { variant: "list" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { empty: true } };
export const Many: Story = { args: { count: 20 } };
