import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SlidesToButtonsArrays } from "../../index";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Slides-To-Buttons-Arrays/Singlepage/admin-v2-table",
  component: SlidesToButtonsArrays,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SlidesToButtonsArrays>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
