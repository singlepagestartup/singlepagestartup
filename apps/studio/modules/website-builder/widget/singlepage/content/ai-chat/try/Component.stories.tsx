import { Component as Widget } from "../../../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-ai-chat-try",
  title: "Modules/Website-Builder/Widget/Singlepage/content/ai-chat/try",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: {
    children: (
      <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
        Chat preview supplied by Host Page
      </div>
    ),
    variant: "content-ai-chat-try",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-ai-chat-try" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
