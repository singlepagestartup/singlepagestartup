import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultContentHeroProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-hero",
  title: "Modules/Website-Builder/Widget/Singlepage/content-hero",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: { ...defaultContentHeroProps, variant: "content-hero" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "content-hero" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
