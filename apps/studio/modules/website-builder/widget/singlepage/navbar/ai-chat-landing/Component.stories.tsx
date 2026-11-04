import { Component as Widget } from "../../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-navbar-ai-chat-landing",
  title: "Modules/Website-Builder/Widget/Singlepage/navbar/ai-chat-landing",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { variant: "navbar-ai-chat-landing" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "navbar-ai-chat-landing" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
