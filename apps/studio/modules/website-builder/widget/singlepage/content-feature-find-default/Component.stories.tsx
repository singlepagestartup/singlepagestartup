import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultContentFeatureFindDefaultProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-feature-find-default",
  title:
    "Modules/Website-Builder/Widget/Singlepage/content-feature-find-default",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    ...defaultContentFeatureFindDefaultProps,
    variant: "content-feature-find-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-feature-find-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
