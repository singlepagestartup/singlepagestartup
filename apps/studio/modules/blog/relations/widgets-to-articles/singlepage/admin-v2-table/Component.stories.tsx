import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WidgetsToArticles } from "../../index";

const meta = {
  title: "Modules/Blog/Relations/Widgets-To-Articles/Singlepage/admin-v2-table",
  component: WidgetsToArticles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WidgetsToArticles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
