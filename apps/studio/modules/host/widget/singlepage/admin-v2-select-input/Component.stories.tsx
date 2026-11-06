import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-widget-singlepage-admin-v2-select-input",
  title: "Modules/Host/Widget/Singlepage/admin-v2-select-input",
  component: Widget,
  parameters: { layout: "padded" },
  args: { variant: "admin-v2-select-input" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "admin-v2-select-input" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
