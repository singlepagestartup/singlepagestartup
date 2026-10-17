import { Component as Article } from "../..";
import { Component as Widget } from "../../../widget/index";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultArticleOverviewDefaultProps } from "./Component";

const meta = {
  id: "modules-blog-models-article-singlepage-overview-default",
  title: "Modules/Blog/Article/Singlepage/overview-default",
  component: Article,
  parameters: {
    layout: "fullscreen",
  },
  args: { ...defaultArticleOverviewDefaultProps, variant: "overview-default" },
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
      variant="overview-default"
    />
  ),
} satisfies Meta<
  Extract<React.ComponentProps<typeof Article>, { variant: "overview-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
