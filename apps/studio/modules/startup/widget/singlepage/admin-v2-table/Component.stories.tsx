import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as StartupModuleWidget } from "../../index";

const meta = {
  title: "Modules/Startup/Models/Widget/Singlepage/admin-v2-table",
  component: StartupModuleWidget,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof StartupModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
