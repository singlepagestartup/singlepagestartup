import type { Meta, StoryObj } from "@storybook/react";

import { BlogFindArticleCard } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-blog-find-article-card",
  title: "Modules/Host/Models/Page/Singlepage",
  component: BlogFindArticleCard,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof BlogFindArticleCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/blog",
};
