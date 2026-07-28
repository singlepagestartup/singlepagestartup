import type { Meta, StoryObj } from "@storybook/react";
import { ArticleDetail, defaultArticleDetailProps } from "./Component";

const meta = {
  title: "Modules/Blog/Models/Article/Singlepage/detail",
  component: ArticleDetail,
  parameters: { layout: "fullscreen" },
  args: defaultArticleDetailProps,
} satisfies Meta<typeof ArticleDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
