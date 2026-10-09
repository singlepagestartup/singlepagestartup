import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  id: "modules-social-relations-chats-to-threads-singlepage-ai-chat-find",
  title: "Modules/Social/Relations/Chats-To-Threads/Singlepage/ai-chat-find",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
