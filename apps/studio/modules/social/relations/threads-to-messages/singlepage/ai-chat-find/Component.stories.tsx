import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  id: "modules-social-relations-threads-to-messages-singlepage-ai-chat-find",
  title: "Modules/Social/Relations/Threads-To-Messages/Singlepage/ai-chat-find",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
