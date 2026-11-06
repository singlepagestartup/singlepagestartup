import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultContentRichProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-rich",
  title: "Modules/Website-Builder/Widget/Singlepage/content-rich",
  component: Widget,
  parameters: { layout: "padded" },
  args: { ...defaultContentRichProps, variant: "content-rich" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "content-rich" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
