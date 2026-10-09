import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  title:
    "Modules/Website-Builder/Models/Widget/Singlepage/navbar/ai-chat/landing",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
