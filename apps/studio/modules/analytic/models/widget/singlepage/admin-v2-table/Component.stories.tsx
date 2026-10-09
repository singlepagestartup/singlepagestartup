import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as AnalyticModuleWidget } from "../../index";

const meta = {
  title: "Modules/Analytic/Models/Widget/Singlepage/admin-v2-table",
  component: AnalyticModuleWidget,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof AnalyticModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
