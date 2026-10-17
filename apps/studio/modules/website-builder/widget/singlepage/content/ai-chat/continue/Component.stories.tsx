import { Component as Widget } from "../../../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-ai-chat-continue",
  title: "Modules/Website-Builder/Widget/Singlepage/content/ai-chat/continue",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { variant: "content-ai-chat-continue" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-ai-chat-continue" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
