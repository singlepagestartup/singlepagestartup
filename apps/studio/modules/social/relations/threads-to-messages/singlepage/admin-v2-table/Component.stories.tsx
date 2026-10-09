import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ThreadsToMessages } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Threads-To-Messages/Singlepage/admin-v2-table",
  component: ThreadsToMessages,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ThreadsToMessages>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
