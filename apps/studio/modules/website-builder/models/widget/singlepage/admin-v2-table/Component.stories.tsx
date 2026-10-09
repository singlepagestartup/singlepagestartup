import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WebsiteBuilderModuleWidget } from "../../index";

const meta = {
  title: "Modules/Website-Builder/Models/Widget/Singlepage/admin-v2-table",
  component: WebsiteBuilderModuleWidget,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WebsiteBuilderModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
