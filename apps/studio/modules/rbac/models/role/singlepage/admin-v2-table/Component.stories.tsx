import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as RbacModuleRole } from "../../index";

const meta = {
  title: "Modules/RBAC/Models/Role/Singlepage/admin-v2-table",
  component: RbacModuleRole,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof RbacModuleRole>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
