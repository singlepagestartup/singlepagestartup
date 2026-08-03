import type { Meta, StoryObj } from "@storybook/react";

import { ArticleFeatured, defaultArticleFeaturedProps } from "./Component";

const meta = {
  title: "Modules/Blog/Models/Article/Singlepage/featured",
  component: ArticleFeatured,
  parameters: {
    layout: "padded",
  },
  args: defaultArticleFeaturedProps,
} satisfies Meta<typeof ArticleFeatured>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
