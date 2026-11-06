import { Component as Article } from "../..";
import type { Meta, StoryObj } from "@storybook/react";
import { defaultArticleCoverProps } from "./Component";

const meta = {
  id: "modules-blog-models-article-singlepage-cover",
  title: "Modules/Blog/Article/Singlepage/cover",
  component: Article,
  parameters: { layout: "fullscreen" },
  args: { ...defaultArticleCoverProps, variant: "cover" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Article>, { variant: "cover" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
