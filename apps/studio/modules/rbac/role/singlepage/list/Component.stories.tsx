import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as RbacModuleRole } from "../../index";
const meta = {
  title: "Modules/RBAC/Models/Role/Singlepage/list",
  component: RbacModuleRole,
  args: { variant: "list", count: 3, empty: false },
  argTypes: {
    count: { control: { type: "number", min: 0, max: 50 } },
    empty: { control: "boolean" },
  },
} satisfies Meta<typeof RbacModuleRole>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { empty: true } };
export const Many: Story = { args: { count: 20 } };
