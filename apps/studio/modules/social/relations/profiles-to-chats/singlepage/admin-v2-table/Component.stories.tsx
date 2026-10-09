import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProfilesToChats } from "../../index";

const meta = {
  title: "Modules/Social/Relations/Profiles-To-Chats/Singlepage/admin-v2-table",
  component: ProfilesToChats,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ProfilesToChats>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
