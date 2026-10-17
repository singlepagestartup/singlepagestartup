import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Message } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-social-models-message-singlepage-admin-v2-card",
  title: "Modules/Social/Message/Singlepage/admin-v2-card",
  component: Message,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Message>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
