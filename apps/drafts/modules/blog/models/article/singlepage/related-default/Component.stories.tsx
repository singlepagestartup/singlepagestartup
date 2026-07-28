import type { Meta, StoryObj } from "@storybook/react";

import {
  ArticleRelatedDefault,
  defaultArticleRelatedDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/Blog/Models/Article/Singlepage/related-default",
  component: ArticleRelatedDefault,
  parameters: {
    layout: "padded",
  },
  args: defaultArticleRelatedDefaultProps,
} satisfies Meta<typeof ArticleRelatedDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
