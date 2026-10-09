import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WebsiteBuilderModuleSlider } from "../../index";

const meta = {
  title: "Modules/Website-Builder/Models/Slider/Singlepage/admin-v2-table",
  component: WebsiteBuilderModuleSlider,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WebsiteBuilderModuleSlider>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
