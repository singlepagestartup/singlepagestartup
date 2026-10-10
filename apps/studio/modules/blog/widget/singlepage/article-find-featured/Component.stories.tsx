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
  argTypes: {
    count: { control: { type: "number", min: 0, max: 20, step: 1 } },
    compact: { control: "boolean" },
  },
} satisfies Meta<typeof ArticleFindFeatured>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
