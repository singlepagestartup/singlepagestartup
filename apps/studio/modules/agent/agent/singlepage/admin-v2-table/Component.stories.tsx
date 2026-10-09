import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as AgentModuleAgent } from "../../index";

const meta = {
  title: "Modules/Agent/Models/Agent/Singlepage/admin-v2-table",
  component: AgentModuleAgent,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof AgentModuleAgent>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
