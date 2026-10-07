import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  id: "modules-host-models-page-singlepage-ai-chat-help",
  title: "Modules/Host/Models/Page/Singlepage",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = { name: "/ai-chat/help" };
