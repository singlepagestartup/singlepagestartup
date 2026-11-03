import { Component as Widget } from "../../../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-ai-chat-hero",
  title: "Modules/Website-Builder/Widget/Singlepage/content/ai-chat/hero",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { variant: "content-ai-chat-hero" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-ai-chat-hero" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
