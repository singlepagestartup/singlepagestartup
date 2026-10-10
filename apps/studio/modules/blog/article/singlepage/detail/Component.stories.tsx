import { Component as BlogModuleWidget } from "../../../widget";
import type { Meta, StoryObj } from "@storybook/react";
import { ArticleDetail, defaultArticleDetailProps } from "./Component";

const meta = {
  title: "Modules/Blog/Models/Article/Singlepage/detail",
  component: ArticleDetail,
  parameters: { layout: "fullscreen" },
  args: defaultArticleDetailProps,
  argTypes: { tagsCard: { control: false } },
  render: (args) => (
    <ArticleDetail
      {...args}
      tagsCard={
        <BlogModuleWidget
          variant="article-find-by-id-tag-find-default"
          tags={args?.tags}
        />
      }
    />
  ),
} satisfies Meta<typeof ArticleDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
