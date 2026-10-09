import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WidgetsToForms } from "../../index";

const meta = {
  title: "Modules/CRM/Relations/Widgets-To-Forms/Singlepage/admin-v2-table",
  component: WidgetsToForms,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WidgetsToForms>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
