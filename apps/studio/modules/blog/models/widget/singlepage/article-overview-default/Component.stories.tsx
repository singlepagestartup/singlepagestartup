import type { Meta, StoryObj } from "@storybook/react";

import {
  ArticleOverviewDefaultWidget,
  defaultArticleOverviewDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/Blog/Models/Widget/Singlepage/article-overview-default",
  component: ArticleOverviewDefaultWidget,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultArticleOverviewDefaultProps,
} satisfies Meta<typeof ArticleOverviewDefaultWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
