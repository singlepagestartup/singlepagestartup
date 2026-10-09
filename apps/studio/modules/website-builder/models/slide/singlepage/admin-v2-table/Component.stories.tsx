import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WebsiteBuilderModuleSlide } from "../../index";

const meta = {
  title: "Modules/Website-Builder/Models/Slide/Singlepage/admin-v2-table",
  component: WebsiteBuilderModuleSlide,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WebsiteBuilderModuleSlide>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
