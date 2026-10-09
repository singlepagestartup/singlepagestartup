import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as RbacModuleIdentity } from "../../index";

const meta = {
  title: "Modules/RBAC/Models/Identity/Singlepage/admin-v2-table",
  component: RbacModuleIdentity,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof RbacModuleIdentity>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
