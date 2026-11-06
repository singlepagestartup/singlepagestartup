import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultArticleFindByIdTagFindProps } from "./Component";

const meta = {
  id: "modules-blog-models-widget-singlepage-article-find-by-id-tag-find-default",
  title: "Modules/Blog/Widget/Singlepage/article-find-by-id-tag-find-default",
  component: Widget,
  parameters: { layout: "padded" },
  args: {
    ...defaultArticleFindByIdTagFindProps,
    variant: "article-find-by-id-tag-find-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "article-find-by-id-tag-find-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
