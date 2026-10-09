import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as BlogModuleCategory } from "../../index";

const meta = {
  title: "Modules/Blog/Models/Category/Singlepage/admin-v2-table",
  component: BlogModuleCategory,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof BlogModuleCategory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
