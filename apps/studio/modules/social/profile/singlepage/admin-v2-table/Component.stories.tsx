import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SocialModuleProfile } from "../../index";

const meta = {
  title: "Modules/Social/Models/Profile/Singlepage/admin-v2-table",
  component: SocialModuleProfile,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof SocialModuleProfile>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
