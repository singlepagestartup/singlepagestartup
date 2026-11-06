import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultTagFindButtonProps } from "./Component";

const meta = {
  id: "modules-blog-models-widget-singlepage-tag-find-button",
  title: "Modules/Blog/Widget/Singlepage/tag-find-button",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { ...defaultTagFindButtonProps, variant: "tag-find-button" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "tag-find-button" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
