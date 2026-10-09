import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WidgetsToProducts } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Widgets-To-Products/Singlepage/admin-v2-table",
  component: WidgetsToProducts,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WidgetsToProducts>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
