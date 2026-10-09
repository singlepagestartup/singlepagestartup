import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as LayoutsToWidgets } from "../../index";

const meta = {
  title: "Modules/Host/Relations/Layouts-To-Widgets/Singlepage/admin-v2-table",
  component: LayoutsToWidgets,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof LayoutsToWidgets>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
