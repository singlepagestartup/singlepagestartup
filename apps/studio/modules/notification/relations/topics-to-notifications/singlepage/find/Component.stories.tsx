import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as TopicsToNotifications } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Notification/Relations/Topics-To-Notifications/Singlepage/find",
  component: TopicsToNotifications,
  args: { variant: "find" },
} satisfies Meta<typeof TopicsToNotifications>;
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
              column: "topicId",
              method: "eq",
              value: fixture.records[0].topicId,
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
