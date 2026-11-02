import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Notification } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-notification-models-notification-singlepage-admin-v2-card",
  title: "Modules/Notification/Notification/Singlepage/admin-v2-card",
  component: Notification,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Notification>,
    { variant: "admin-v2-card" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
