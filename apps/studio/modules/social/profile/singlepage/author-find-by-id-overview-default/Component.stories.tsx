import { Component as Profile } from "../..";
import { Component as BlogModuleArticle } from "../../../../blog/article/index";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProfileAuthorFindByIdOverviewDefaultProps } from "./Component";

const meta = {
  id: "modules-social-models-profile-singlepage-author-find-by-id-overview-default",
  title: "Modules/Social/Profile/Singlepage/author-find-by-id-overview-default",
  component: Profile,
  parameters: { layout: "fullscreen" },
  args: {
    ...defaultProfileAuthorFindByIdOverviewDefaultProps,
    variant: "author-find-by-id-overview-default",
  },
  argTypes: { articles: { control: false } },
  render: (args) => (
    <Profile
      {...args}
      articles={Array.from({ length: 2 }, (_, index) => (
        <BlogModuleArticle key={`author-article-${index}`} variant="row" />
      ))}
      variant="author-find-by-id-overview-default"
    />
  ),
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Profile>,
    { variant: "author-find-by-id-overview-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
