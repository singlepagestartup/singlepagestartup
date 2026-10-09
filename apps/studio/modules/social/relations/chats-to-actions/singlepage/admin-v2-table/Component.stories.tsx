import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ChatsToActions } from "../../index";

const meta = {
  title: "Modules/Social/Relations/Chats-To-Actions/Singlepage/admin-v2-table",
  component: ChatsToActions,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ChatsToActions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
