import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";
import { defaultArticleFindCardDefaultProps } from "./Component";

const meta = {
  id: "modules-blog-models-widget-singlepage-article-find-card-default",
  title: "Modules/Blog/Widget/Singlepage/article-find-card-default",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: {
    ...defaultArticleFindCardDefaultProps,
    variant: "article-find-card-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "article-find-card-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

import { Skeleton } from "./Skeleton";
export const Loading: Story = { render: () => <Skeleton /> };
export const Empty: Story = { args: { articles: [] } };
export const Pagination: Story = { args: { pageSize: 3 } };
