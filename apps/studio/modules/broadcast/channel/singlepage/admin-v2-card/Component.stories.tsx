import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as BroadcastModuleChannel } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Broadcast/Models/Channel/Singlepage/admin-v2-card",
  component: BroadcastModuleChannel,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<typeof BroadcastModuleChannel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
