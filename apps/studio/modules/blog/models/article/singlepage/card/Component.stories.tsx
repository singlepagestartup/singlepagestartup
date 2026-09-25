import type { Meta, StoryObj } from "@storybook/react";

import { ArticleCard, defaultArticleCardProps } from "./Component";

const meta = {
  title: "Modules/Blog/Models/Article/Singlepage/card",
  component: ArticleCard,
  parameters: {
    layout: "padded",
  },
  args: defaultArticleCardProps,
} satisfies Meta<typeof ArticleCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
