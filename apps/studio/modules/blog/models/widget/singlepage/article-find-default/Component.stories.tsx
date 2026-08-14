import type { Meta, StoryObj } from "@storybook/react";

import {
  ArticleFindDefault,
  defaultArticleFindDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/Blog/Models/Widget/Singlepage/article-find-default",
  component: ArticleFindDefault,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultArticleFindDefaultProps,
} satisfies Meta<typeof ArticleFindDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
