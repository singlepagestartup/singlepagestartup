import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as RbacModulePermission } from "../../index";

const meta = {
  title: "Modules/RBAC/Models/Permission/Singlepage/admin-v2-table",
  component: RbacModulePermission,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof RbacModulePermission>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
