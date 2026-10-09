import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WidgetsToCategories } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Widgets-To-Categories/Singlepage/admin-v2-table",
  component: WidgetsToCategories,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WidgetsToCategories>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
