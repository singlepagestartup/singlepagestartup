import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Widget } from "../../index";

const meta = {
  id: "modules-rbac-models-widget-singlepage-admin-v2-table",
  title: "Modules/RBAC/Widget/Singlepage/admin-v2-table",
  component: Widget,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
