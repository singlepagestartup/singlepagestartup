import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SlidersToSlides } from "../../index";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Sliders-To-Slides/Singlepage/admin-v2-table",
  component: SlidersToSlides,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SlidersToSlides>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
