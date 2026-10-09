import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ChannelsToMessages } from "../../index";

const meta = {
  title:
    "Modules/Broadcast/Relations/Channels-To-Messages/Singlepage/admin-v2-table",
  component: ChannelsToMessages,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ChannelsToMessages>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
