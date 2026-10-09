import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WidgetsToSliders } from "../../index";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Widgets-To-Sliders/Singlepage/admin-v2-table",
  component: WidgetsToSliders,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WidgetsToSliders>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
