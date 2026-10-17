import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Agent } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-agent-models-agent-singlepage-admin-v2-card",
  title: "Modules/Agent/Agent/Singlepage/admin-v2-card",
  component: Agent,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Agent>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
