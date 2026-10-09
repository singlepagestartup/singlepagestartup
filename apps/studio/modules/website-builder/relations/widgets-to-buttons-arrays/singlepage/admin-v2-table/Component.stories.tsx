import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WidgetsToButtonsArrays } from "../../index";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Widgets-To-Buttons-Arrays/Singlepage/admin-v2-table",
  component: WidgetsToButtonsArrays,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WidgetsToButtonsArrays>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
