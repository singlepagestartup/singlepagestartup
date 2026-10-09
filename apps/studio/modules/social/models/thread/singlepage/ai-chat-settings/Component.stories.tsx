import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  id: "modules-social-models-thread-singlepage-ai-chat-settings",
  title: "Modules/Social/Models/Thread/Singlepage/ai-chat-settings",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
