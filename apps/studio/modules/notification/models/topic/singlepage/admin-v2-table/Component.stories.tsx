import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as NotificationModuleTopic } from "../../index";

const meta = {
  title: "Modules/Notification/Models/Topic/Singlepage/admin-v2-table",
  component: NotificationModuleTopic,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof NotificationModuleTopic>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
