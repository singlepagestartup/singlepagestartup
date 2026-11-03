import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-admin-v2-navigation",
  title: "Modules/Website-Builder/Widget/Singlepage/admin-v2-navigation",
  component: Widget,
  parameters: {
    layout: "centered",
  },
  args: { variant: "admin-v2-navigation" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "admin-v2-navigation" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
