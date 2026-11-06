import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultContentFeatureFindTestimotionalsProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-feature-find-testimotionals",
  title:
    "Modules/Website-Builder/Widget/Singlepage/content-feature-find-testimotionals",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    ...defaultContentFeatureFindTestimotionalsProps,
    variant: "content-feature-find-testimotionals",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-feature-find-testimotionals" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
