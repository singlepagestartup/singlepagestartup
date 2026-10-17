import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultFooterDefaultProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-footer-default",
  title: "Modules/Website-Builder/Widget/Singlepage/footer-default",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: { ...defaultFooterDefaultProps, variant: "footer-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "footer-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
