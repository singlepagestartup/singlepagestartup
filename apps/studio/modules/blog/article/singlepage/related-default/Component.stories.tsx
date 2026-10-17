import { Component as Article } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultArticleRelatedDefaultProps } from "./Component";

const meta = {
  id: "modules-blog-models-article-singlepage-related-default",
  title: "Modules/Blog/Article/Singlepage/related-default",
  component: Article,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultArticleRelatedDefaultProps, variant: "related-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Article>, { variant: "related-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
