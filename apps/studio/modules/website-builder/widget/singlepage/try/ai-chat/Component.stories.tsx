import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  title: "Modules/Website-Builder/Models/Widget/Singlepage/try/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: {
    children: (
      <div className="rounded-2xl border border-sps-line bg-sps-white p-8 text-sps-muted">
        Chat preview supplied by Host Page
      </div>
    ),
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
