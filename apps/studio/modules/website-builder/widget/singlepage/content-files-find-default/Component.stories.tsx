import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultContentFilesFindDefaultProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-files-find-default",
  title: "Modules/Website-Builder/Widget/Singlepage/content-files-find-default",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    ...defaultContentFilesFindDefaultProps,
    variant: "content-files-find-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-files-find-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
