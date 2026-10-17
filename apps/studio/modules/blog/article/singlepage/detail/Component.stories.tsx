import { Component as Article } from "../..";
import { Component as Widget } from "../../../widget/index";
import type { Meta, StoryObj } from "@storybook/react";
import { defaultArticleDetailProps } from "./Component";

const meta = {
  id: "modules-blog-models-article-singlepage-detail",
  title: "Modules/Blog/Article/Singlepage/detail",
  component: Article,
  parameters: { layout: "fullscreen" },
  args: { ...defaultArticleDetailProps, variant: "detail" },
  argTypes: { tagsCard: { control: false } },
  render: (args) => (
    <Article
      {...args}
      tagsCard={
        <Widget
          variant="article-find-by-id-tag-find-default"
          tags={args?.tags}
        />
      }
      variant="detail"
    />
  ),
} satisfies Meta<
  Extract<React.ComponentProps<typeof Article>, { variant: "detail" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
