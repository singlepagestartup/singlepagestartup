import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as RbacModuleWidget } from "../../index";

const meta = {
  title: "Modules/RBAC/Models/Widget/Singlepage/admin-v2-table",
  component: RbacModuleWidget,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof RbacModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
