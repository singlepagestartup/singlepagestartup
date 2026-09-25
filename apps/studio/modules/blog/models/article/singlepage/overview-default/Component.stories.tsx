import type { Meta, StoryObj } from "@storybook/react";

import {
  ArticleOverviewDefault,
  defaultArticleOverviewDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/Blog/Models/Article/Singlepage/overview-default",
  component: ArticleOverviewDefault,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultArticleOverviewDefaultProps,
} satisfies Meta<typeof ArticleOverviewDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
