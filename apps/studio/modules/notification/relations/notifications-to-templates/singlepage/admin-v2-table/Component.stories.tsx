import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as NotificationsToTemplates } from "../../index";

const meta = {
  title:
    "Modules/Notification/Relations/Notifications-To-Templates/Singlepage/admin-v2-table",
  component: NotificationsToTemplates,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof NotificationsToTemplates>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
