import { Component as Article } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultArticleFeaturedProps } from "./Component";

const meta = {
  id: "modules-blog-models-article-singlepage-featured",
  title: "Modules/Blog/Article/Singlepage/featured",
  component: Article,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultArticleFeaturedProps, variant: "featured" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Article>, { variant: "featured" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
