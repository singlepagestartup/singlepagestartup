import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as HostModuleWidget } from "../../index";

const meta = {
  title: "Modules/Host/Models/Widget/Singlepage/admin-v2-table",
  component: HostModuleWidget,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof HostModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
