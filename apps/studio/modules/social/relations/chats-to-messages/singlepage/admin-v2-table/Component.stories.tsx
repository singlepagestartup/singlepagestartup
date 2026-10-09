import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ChatsToMessages } from "../../index";

const meta = {
  title: "Modules/Social/Relations/Chats-To-Messages/Singlepage/admin-v2-table",
  component: ChatsToMessages,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ChatsToMessages>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
