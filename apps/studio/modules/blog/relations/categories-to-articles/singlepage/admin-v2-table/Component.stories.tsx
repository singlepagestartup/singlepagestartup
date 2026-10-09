import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CategoriesToArticles } from "../../index";

const meta = {
  title:
    "Modules/Blog/Relations/Categories-To-Articles/Singlepage/admin-v2-table",
  component: CategoriesToArticles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof CategoriesToArticles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
