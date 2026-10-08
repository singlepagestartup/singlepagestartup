import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  id: "modules-rbac-models-subject-singlepage-ai-chat-account",
  title: "Modules/Rbac/Models/Subject/Singlepage/ai-chat-account",
  component: Component,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
