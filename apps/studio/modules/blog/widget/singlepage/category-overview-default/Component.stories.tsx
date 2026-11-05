import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";

const meta = {
  id: "modules-blog-models-widget-singlepage-category-overview-default",
  title: "Modules/Blog/Widget/Singlepage/category-overview-default",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: { ...{}, variant: "category-overview-default" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Model>,
    { variant: "category-overview-default" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
