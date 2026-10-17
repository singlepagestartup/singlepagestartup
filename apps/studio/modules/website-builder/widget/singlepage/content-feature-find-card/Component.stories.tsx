import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultContentFeatureFindCardProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-feature-find-card",
  title: "Modules/Website-Builder/Widget/Singlepage/content-feature-find-card",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    ...defaultContentFeatureFindCardProps,
    variant: "content-feature-find-card",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-feature-find-card" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
