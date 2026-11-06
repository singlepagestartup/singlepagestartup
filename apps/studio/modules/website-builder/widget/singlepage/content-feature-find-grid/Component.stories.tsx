import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";
import { defaultContentFeatureFindGridProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-feature-find-grid",
  title: "Modules/Website-Builder/Widget/Singlepage/content-feature-find-grid",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: {
    ...defaultContentFeatureFindGridProps,
    variant: "content-feature-find-grid",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-feature-find-grid" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
