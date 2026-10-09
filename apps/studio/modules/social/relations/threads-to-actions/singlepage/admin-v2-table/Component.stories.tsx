import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ThreadsToActions } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Threads-To-Actions/Singlepage/admin-v2-table",
  component: ThreadsToActions,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ThreadsToActions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
