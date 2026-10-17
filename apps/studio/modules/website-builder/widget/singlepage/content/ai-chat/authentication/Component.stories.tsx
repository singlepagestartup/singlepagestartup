import { Component as Widget } from "../../../..";
import type { Meta, StoryObj } from "@storybook/react";

import registrationContent from "./registration.json";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-ai-chat-authentication",
  title:
    "Modules/Website-Builder/Widget/Singlepage/content/ai-chat/authentication",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: {
    children: (
      <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        Subject form slot
      </div>
    ),
    media: "cover",
    asideIcon: "question",
    variant: "content-ai-chat-authentication",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-ai-chat-authentication" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const StackedImages: StoryObj<typeof meta> = {
  args: {
    content: registrationContent,
    media: "stack",
    asideIcon: "shield-check",
  },
};
