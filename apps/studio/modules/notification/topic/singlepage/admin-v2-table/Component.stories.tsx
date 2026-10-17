import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Topic } from "../../index";

const meta = {
  id: "modules-notification-models-topic-singlepage-admin-v2-table",
  title: "Modules/Notification/Topic/Singlepage/admin-v2-table",
  component: Topic,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Topic>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
