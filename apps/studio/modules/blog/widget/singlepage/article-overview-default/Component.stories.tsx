import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultArticleOverviewDefaultProps } from "./Component";

const meta = {
  id: "modules-blog-models-widget-singlepage-article-overview-default",
  title: "Modules/Blog/Widget/Singlepage/article-overview-default",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    ...defaultArticleOverviewDefaultProps,
    variant: "article-overview-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "article-overview-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
