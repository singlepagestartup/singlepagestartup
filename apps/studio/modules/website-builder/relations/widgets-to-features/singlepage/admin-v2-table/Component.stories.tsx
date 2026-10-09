import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WidgetsToFeatures } from "../../index";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Widgets-To-Features/Singlepage/admin-v2-table",
  component: WidgetsToFeatures,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WidgetsToFeatures>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
