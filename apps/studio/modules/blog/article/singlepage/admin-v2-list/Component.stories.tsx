import type { Meta, StoryObj } from "@storybook/react";

import { BlogArticleAdminV2List } from "./Component";

const meta = {
  id: "modules-blog-models-article-singlepage-admin-v2-list",
  title: "Modules/Blog/Models/Article/Singlepage/admin-v2-list",
  component: BlogArticleAdminV2List,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof BlogArticleAdminV2List>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
