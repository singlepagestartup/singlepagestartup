import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultArticleFindFeaturedProps } from "./Component";

const meta = {
  id: "modules-blog-models-widget-singlepage-article-find-featured",
  title: "Modules/Blog/Widget/Singlepage/article-find-featured",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    ...defaultArticleFindFeaturedProps,
    variant: "article-find-featured",
  },
  argTypes: {
    count: { control: { type: "number", min: 0, max: 20, step: 1 } },
    compact: { control: "boolean" },
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "article-find-featured" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
