import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  id: "modules-social-models-profile-singlepage-ai-chat-navigation",
  title: "Modules/Social/Models/Profile/Singlepage/ai-chat-navigation",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
