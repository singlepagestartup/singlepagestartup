import { Component as Article } from "../..";
import { Component as Widget } from "../../../widget/index";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultArticleOverviewDefaultProps } from "./Component";
import { frameworkArticlePreviews } from "../../index";

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
        args.tags?.length ? (
          <Widget
            variant="article-find-by-id-tag-find-default"
            tags={args?.tags}
          />
        ) : undefined
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
export const Hono: Story = { args: frameworkArticlePreviews[2] };
export const LocalStack: Story = { args: frameworkArticlePreviews[4] };
