import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Widget } from "../../";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-ecommerce-default",
  title: "Modules/Website Builder/Widget/Singlepage/content-ecommerce-default",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { variant: "content-ecommerce-default", title: "Заказы" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-ecommerce-default" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
