import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultContentCtaProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-cta",
  title: "Modules/Website-Builder/Widget/Singlepage/content-cta",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: { ...defaultContentCtaProps, variant: "content-cta" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "content-cta" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
