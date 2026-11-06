import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Channel } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-broadcast-models-channel-singlepage-admin-v2-card",
  title: "Modules/Broadcast/Channel/Singlepage/admin-v2-card",
  component: Channel,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Channel>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
