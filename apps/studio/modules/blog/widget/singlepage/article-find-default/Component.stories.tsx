import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultArticleFindDefaultProps } from "./Component";

const meta = {
  id: "modules-blog-models-widget-singlepage-article-find-default",
  title: "Modules/Blog/Widget/Singlepage/article-find-default",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: { ...defaultArticleFindDefaultProps, variant: "article-find-default" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "article-find-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
