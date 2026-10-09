import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as BroadcastModuleMessage } from "../../index";

const meta = {
  title: "Modules/Broadcast/Models/Message/Singlepage/admin-v2-table",
  component: BroadcastModuleMessage,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof BroadcastModuleMessage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
