import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WidgetsToLogotypes } from "../../index";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Widgets-To-Logotypes/Singlepage/admin-v2-table",
  component: WidgetsToLogotypes,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WidgetsToLogotypes>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
