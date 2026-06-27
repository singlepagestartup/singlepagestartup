import type { Meta, StoryObj } from "@storybook/react";

import {
  ArticleFindFeatured,
  defaultArticleFindFeaturedProps,
} from "./Component";

const meta = {
  title: "Modules/Blog/Models/Widget/Singlepage/article-find-featured",
  component: ArticleFindFeatured,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultArticleFindFeaturedProps,
} satisfies Meta<typeof ArticleFindFeatured>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
