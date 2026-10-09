import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as AgentModuleWidget } from "../../index";

const meta = {
  title: "Modules/Agent/Models/Widget/Singlepage/admin-v2-table",
  component: AgentModuleWidget,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof AgentModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
