import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  id: "modules-social-models-chat-singlepage-ai-chat-navigation",
  title: "Modules/Social/Models/Chat/Singlepage/ai-chat-navigation",
  component: Component,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
