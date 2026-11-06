import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-widget-singlepage-default",
  title: "Modules/Host/Widget/Singlepage/default",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { variant: "default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "default" }>
>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "default" };
export const Product: Story = {
  args: {
    externalModule: "ecommerce",
  },
};
