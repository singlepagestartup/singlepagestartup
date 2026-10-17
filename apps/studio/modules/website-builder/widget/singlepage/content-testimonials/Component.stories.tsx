import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";
import { defaultContentTestimonialsProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-testimonials",
  title: "Modules/Website-Builder/Widget/Singlepage/content-testimonials",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { ...defaultContentTestimonialsProps, variant: "content-testimonials" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-testimonials" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
