import { Component as Article } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-blog-models-article-singlepage-admin-v2-list",
  title: "Modules/Blog/Article/Singlepage/admin-v2-list",
  component: Article,
  parameters: {
    layout: "centered",
  },
  args: { variant: "admin-v2-list" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Article>, { variant: "admin-v2-list" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
