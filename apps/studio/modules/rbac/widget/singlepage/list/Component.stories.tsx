import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as RbacModuleWidget } from "../../index";
const meta = {
  title: "Modules/RBAC/Models/Widget/Singlepage/list",
  component: RbacModuleWidget,
  args: { variant: "list", count: 3, empty: false },
  argTypes: {
    count: { control: { type: "number", min: 0, max: 50 } },
    empty: { control: "boolean" },
  },
} satisfies Meta<typeof RbacModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { empty: true } };
export const Many: Story = { args: { count: 20 } };
