import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as NotificationModuleNotification } from "../../index";

const meta = {
  title: "Modules/Notification/Models/Notification/Singlepage/admin-v2-table",
  component: NotificationModuleNotification,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof NotificationModuleNotification>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
