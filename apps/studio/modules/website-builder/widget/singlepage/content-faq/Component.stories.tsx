import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";
import { defaultContentFaqProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-faq",
  title: "Modules/Website-Builder/Widget/Singlepage/content-faq",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { ...defaultContentFaqProps, variant: "content-faq" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "content-faq" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
