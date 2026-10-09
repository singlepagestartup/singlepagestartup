import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WidgetsToExternalWidgets } from "../../index";

const meta = {
  title:
    "Modules/Host/Relations/Widgets-To-External-Widgets/Singlepage/admin-v2-table",
  component: WidgetsToExternalWidgets,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WidgetsToExternalWidgets>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
