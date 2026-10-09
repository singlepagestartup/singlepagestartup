import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as BroadcastModuleChannel } from "../../index";

const meta = {
  title: "Modules/Broadcast/Models/Channel/Singlepage/admin-v2-table",
  component: BroadcastModuleChannel,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof BroadcastModuleChannel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
