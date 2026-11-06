import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultContentButtonsArrayFindDefaultProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-buttons-array-find-default",
  title:
    "Modules/Website-Builder/Widget/Singlepage/content-buttons-array-find-default",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    ...defaultContentButtonsArrayFindDefaultProps,
    variant: "content-buttons-array-find-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-buttons-array-find-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
