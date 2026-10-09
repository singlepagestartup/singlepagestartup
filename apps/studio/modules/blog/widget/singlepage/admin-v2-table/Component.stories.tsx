import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as BlogModuleWidget } from "../../index";

const meta = {
  title: "Modules/Blog/Models/Widget/Singlepage/admin-v2-table",
  component: BlogModuleWidget,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof BlogModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
