import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as PagesToWidgets } from "../../index";

const meta = {
  title: "Modules/Host/Relations/Pages-To-Widgets/Singlepage/admin-v2-table",
  component: PagesToWidgets,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof PagesToWidgets>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
