import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as BlogModuleWidget } from "../../index";

const meta = {
  title: "Modules/Blog/Models/Widget/Singlepage/admin-v2-table",
  component: BlogModuleWidget,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof BlogModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
