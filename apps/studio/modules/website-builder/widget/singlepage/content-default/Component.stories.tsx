import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultContentProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-default",
  title: "Modules/Website-Builder/Widget/Singlepage/content-default",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: { ...defaultContentProps, variant: "content-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "content-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
