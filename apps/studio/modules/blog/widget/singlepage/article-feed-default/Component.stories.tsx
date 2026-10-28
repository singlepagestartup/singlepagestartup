import type { Meta, StoryObj } from "@storybook/react";
import { Component as Widget } from "../..";
import type { ComponentProps } from "react";
const meta = {
  id: "modules-blog-models-widget-singlepage-article-feed-default",
  title: "Modules/Blog/Widget/Singlepage/article-feed-default",
  component: Widget,
  args: { variant: "article-feed-default" },
} satisfies Meta<
  Extract<ComponentProps<typeof Widget>, { variant: "article-feed-default" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
