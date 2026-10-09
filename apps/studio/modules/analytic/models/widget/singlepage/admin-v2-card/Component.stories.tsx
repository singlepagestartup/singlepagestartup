import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as AnalyticModuleWidget } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Analytic/Models/Widget/Singlepage/admin-v2-card",
  component: AnalyticModuleWidget,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<typeof AnalyticModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
