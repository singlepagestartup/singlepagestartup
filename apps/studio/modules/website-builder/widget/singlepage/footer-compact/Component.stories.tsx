import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultFooterCompactProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-footer-compact",
  title: "Modules/Website-Builder/Widget/Singlepage/footer-compact",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: { ...defaultFooterCompactProps, variant: "footer-compact" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "footer-compact" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
