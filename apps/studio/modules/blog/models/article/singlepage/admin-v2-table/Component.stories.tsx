import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as BlogModuleArticle } from "../../index";

const meta = {
  title: "Modules/Blog/Models/Article/Singlepage/admin-v2-table",
  component: BlogModuleArticle,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof BlogModuleArticle>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
