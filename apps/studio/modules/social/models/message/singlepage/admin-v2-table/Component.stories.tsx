import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SocialModuleMessage } from "../../index";

const meta = {
  title: "Modules/Social/Models/Message/Singlepage/admin-v2-table",
  component: SocialModuleMessage,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SocialModuleMessage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
