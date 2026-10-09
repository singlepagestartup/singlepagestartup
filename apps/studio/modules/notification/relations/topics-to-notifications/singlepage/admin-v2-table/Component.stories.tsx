import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as TopicsToNotifications } from "../../index";

const meta = {
  title:
    "Modules/Notification/Relations/Topics-To-Notifications/Singlepage/admin-v2-table",
  component: TopicsToNotifications,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof TopicsToNotifications>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
