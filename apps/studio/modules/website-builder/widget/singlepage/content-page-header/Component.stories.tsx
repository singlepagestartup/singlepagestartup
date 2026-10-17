import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";
import { defaultContentPageHeaderProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-page-header",
  title: "Modules/Website-Builder/Widget/Singlepage/content-page-header",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { ...defaultContentPageHeaderProps, variant: "content-page-header" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-page-header" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
