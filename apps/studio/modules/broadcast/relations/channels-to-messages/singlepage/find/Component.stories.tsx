import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ChannelsToMessages } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Broadcast/Relations/Channels-To-Messages/Singlepage/find",
  component: ChannelsToMessages,
  args: { variant: "find" },
} satisfies Meta<typeof ChannelsToMessages>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filtered: Story = {
  args: {
    apiProps: {
      params: {
        filters: {
          and: [
            {
              column: "channelId",
              method: "eq",
              value: fixture.records[0].channelId,
            },
          ],
        },
      },
    },
  },
};
export const Empty: Story = {
  args: {
    apiProps: {
      params: {
        filters: { and: [{ column: "id", method: "eq", value: "missing" }] },
      },
    },
  },
};
