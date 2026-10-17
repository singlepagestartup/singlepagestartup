import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Topic } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-notification-models-topic-singlepage-admin-v2-card",
  title: "Modules/Notification/Topic/Singlepage/admin-v2-card",
  component: Topic,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Topic>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
