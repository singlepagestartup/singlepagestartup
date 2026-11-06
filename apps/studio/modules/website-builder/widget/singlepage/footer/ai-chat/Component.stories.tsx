import { Component as Widget } from "../../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-footer-ai-chat",
  title: "Modules/Website-Builder/Widget/Singlepage/footer/ai-chat",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { variant: "footer-ai-chat" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "footer-ai-chat" }>
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
