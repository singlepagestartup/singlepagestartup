import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SocialModuleAttribute } from "../../index";

const meta = {
  title: "Modules/Social/Models/Attribute/Singlepage/admin-v2-table",
  component: SocialModuleAttribute,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof SocialModuleAttribute>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
