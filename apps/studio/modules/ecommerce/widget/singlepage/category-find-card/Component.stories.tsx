import { defaultCategories } from "./Component";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";
import { Skeleton } from "./Skeleton";
const meta = {
  id: "modules-ecommerce-models-widget-singlepage-category-find-card",
  title: "Modules/Ecommerce/Widget/Singlepage/category-find-card",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    categories: defaultCategories,
    loading: false,
    variant: "category-find-card",
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Model>, { variant: "category-find-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { categories: [] } };
export const Loading: Story = { render: () => <Skeleton /> };
