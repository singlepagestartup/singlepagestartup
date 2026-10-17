import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Metric } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-analytic-models-metric-singlepage-admin-v2-card",
  title: "Modules/Analytic/Metric/Singlepage/admin-v2-card",
  component: Metric,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Metric>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
