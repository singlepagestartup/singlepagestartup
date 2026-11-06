import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton as Component } from "./index";
const meta = {
  id: "modules-ecommerce-models-widget-singlepage-loading",
  title: "Modules/Ecommerce/Widget/Singlepage/Loading",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: { variant: "product-find-card" },
} satisfies Meta<typeof Component>;
export default meta;
export const Loading: StoryObj<typeof meta> = {};

export const CategoryGrid: StoryObj<typeof meta> = {
  args: { variant: "category-find-card" },
};
