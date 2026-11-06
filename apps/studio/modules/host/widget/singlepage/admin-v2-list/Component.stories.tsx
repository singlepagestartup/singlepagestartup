import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-widget-singlepage-admin-v2-list",
  title: "Modules/Host/Widget/Singlepage/admin-v2-list",
  component: Widget,
  parameters: { layout: "padded" },
  args: { variant: "admin-v2-list" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "admin-v2-list" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
