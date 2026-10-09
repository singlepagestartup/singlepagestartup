import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SocialModuleAction } from "../../index";

const meta = {
  title: "Modules/Social/Models/Action/Singlepage/admin-v2-table",
  component: SocialModuleAction,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SocialModuleAction>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
