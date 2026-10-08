import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  id: "modules-knowledge-models-source-singlepage-ai-chat-navigation",
  title: "Modules/Knowledge/Models/Source/Singlepage/ai-chat-navigation",
  component: Component,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
