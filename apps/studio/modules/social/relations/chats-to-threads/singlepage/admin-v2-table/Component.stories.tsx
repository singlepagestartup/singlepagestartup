import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ChatsToThreads } from "../../index";

const meta = {
  title: "Modules/Social/Relations/Chats-To-Threads/Singlepage/admin-v2-table",
  component: ChatsToThreads,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ChatsToThreads>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
