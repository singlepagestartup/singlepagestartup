import { Component as Article } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultArticleRowProps } from "./Component";

const meta = {
  id: "modules-blog-models-article-singlepage-row",
  title: "Modules/Blog/Article/Singlepage/row",
  component: Article,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultArticleRowProps, variant: "row" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Article>, { variant: "row" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
