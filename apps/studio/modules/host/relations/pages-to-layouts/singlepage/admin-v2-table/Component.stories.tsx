import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as PagesToLayouts } from "../../index";

const meta = {
  title: "Modules/Host/Relations/Pages-To-Layouts/Singlepage/admin-v2-table",
  component: PagesToLayouts,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof PagesToLayouts>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
