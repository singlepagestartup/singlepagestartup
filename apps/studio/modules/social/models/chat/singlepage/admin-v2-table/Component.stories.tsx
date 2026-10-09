import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SocialModuleChat } from "../../index";

const meta = {
  title: "Modules/Social/Models/Chat/Singlepage/admin-v2-table",
  component: SocialModuleChat,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SocialModuleChat>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
