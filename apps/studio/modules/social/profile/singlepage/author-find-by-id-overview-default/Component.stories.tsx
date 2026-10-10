import { Component as BlogModuleArticle } from "../../../../blog/article";
import type { Meta, StoryObj } from "@storybook/react";

import {
  ProfileAuthorFindByIdOverviewDefault,
  defaultProfileAuthorFindByIdOverviewDefaultProps,
} from "./Component";

const meta = {
  title:
    "Modules/Social/Models/Profile/Singlepage/author-find-by-id-overview-default",
  component: ProfileAuthorFindByIdOverviewDefault,
  parameters: { layout: "fullscreen" },
  args: defaultProfileAuthorFindByIdOverviewDefaultProps,
  argTypes: { articles: { control: false } },
  render: (args) => (
    <ProfileAuthorFindByIdOverviewDefault
      {...args}
      articles={Array.from({ length: 2 }, (_, index) => (
        <BlogModuleArticle key={`author-article-${index}`} variant="row" />
      ))}
    />
  ),
} satisfies Meta<typeof ProfileAuthorFindByIdOverviewDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
