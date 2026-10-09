import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as NotificationModuleWidget } from "../../index";

const meta = {
  title: "Modules/Notification/Models/Widget/Singlepage/admin-v2-table",
  component: NotificationModuleWidget,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof NotificationModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
