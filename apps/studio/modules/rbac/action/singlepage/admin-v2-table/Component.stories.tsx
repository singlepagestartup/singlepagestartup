import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as RbacModuleAction } from "../../index";

const meta = {
  title: "Modules/RBAC/Models/Action/Singlepage/admin-v2-table",
  component: RbacModuleAction,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof RbacModuleAction>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
