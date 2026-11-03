import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton as Component } from "./index";
const meta = {
  id: "modules-blog-models-widget-singlepage-loading",
  title: "Modules/Blog/Widget/Singlepage/Loading",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: { variant: "article-find-card-default" },
} satisfies Meta<typeof Component>;
export default meta;
export const Loading: StoryObj<typeof meta> = {};

export const CategoryGrid: StoryObj<typeof meta> = {
  args: { variant: "category-find-card" },
};
