import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";

const meta = {
  id: "modules-ecommerce-models-category-singlepage-overview-default",
  title: "Modules/Ecommerce/Category/Singlepage/overview-default",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: { ...{}, variant: "overview-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Model>, { variant: "overview-default" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
