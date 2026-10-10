import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SocialModuleAttributeKey } from "../../index";

const meta = {
  title: "Modules/Social/Models/Attribute-Key/Singlepage/admin-v2-table",
  component: SocialModuleAttributeKey,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof SocialModuleAttributeKey>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
