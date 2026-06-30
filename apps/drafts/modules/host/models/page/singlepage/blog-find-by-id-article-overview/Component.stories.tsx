import type { Meta, StoryObj } from "@storybook/react";

import { BlogFindByIdArticleOverview } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-blog-find-by-id-article-overview",
  title: "Modules/Host/Models/Page/Singlepage",
  component: BlogFindByIdArticleOverview,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof BlogFindByIdArticleOverview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/blog/articles/[blog.articles.slug]",
};

export const RunnableBlogArticleRoute: Story = {
  name: "/blog/:slug",
};
