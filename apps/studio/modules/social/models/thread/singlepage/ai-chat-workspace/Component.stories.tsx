import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  id: "modules-social-models-thread-singlepage-ai-chat-workspace",
  title: "Modules/Social/Models/Thread/Singlepage/ai-chat-workspace",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
