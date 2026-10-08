import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  id: "modules-knowledge-models-source-singlepage-ai-chat-section",
  title: "Modules/Knowledge/Models/Source/Singlepage/ai-chat-section",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
