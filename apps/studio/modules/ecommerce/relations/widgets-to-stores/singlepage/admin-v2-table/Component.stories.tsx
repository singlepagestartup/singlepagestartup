import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WidgetsToStores } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Widgets-To-Stores/Singlepage/admin-v2-table",
  component: WidgetsToStores,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WidgetsToStores>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
