import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Metric } from "../../index";

const meta = {
  id: "modules-analytic-models-metric-singlepage-admin-v2-table",
  title: "Modules/Analytic/Metric/Singlepage/admin-v2-table",
  component: Metric,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Metric>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
