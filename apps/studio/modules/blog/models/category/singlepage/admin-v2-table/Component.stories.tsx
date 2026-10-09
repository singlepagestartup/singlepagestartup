import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as BlogModuleCategory } from "../../index";

const meta = {
  title: "Modules/Blog/Models/Category/Singlepage/admin-v2-table",
  component: BlogModuleCategory,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof BlogModuleCategory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
