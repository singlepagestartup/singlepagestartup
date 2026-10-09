import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as AnalyticModuleMetric } from "../../index";

const meta = {
  title: "Modules/Analytic/Models/Metric/Singlepage/admin-v2-table",
  component: AnalyticModuleMetric,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof AnalyticModuleMetric>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
