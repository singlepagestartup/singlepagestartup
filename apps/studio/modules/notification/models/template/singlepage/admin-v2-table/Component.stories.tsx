import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as NotificationModuleTemplate } from "../../index";

const meta = {
  title: "Modules/Notification/Models/Template/Singlepage/admin-v2-table",
  component: NotificationModuleTemplate,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof NotificationModuleTemplate>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
