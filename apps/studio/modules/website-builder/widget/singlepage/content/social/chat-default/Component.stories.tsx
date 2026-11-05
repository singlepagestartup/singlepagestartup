import { Component as Widget } from "../../../..";
import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-social-chat-default",
  title:
    "Modules/Website-Builder/Widget/Singlepage/content/social/chat-default",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "content-social-chat-default",
    children: <p className="p-5">Chat content slot</p>,
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-social-chat-default" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
