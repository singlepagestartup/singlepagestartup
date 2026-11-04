import { Component as Widget } from "../../../..";
import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-ai-chat-forgot-password",
  title:
    "Modules/Website-Builder/Widget/Singlepage/content/ai-chat/forgot-password",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "content-ai-chat-forgot-password",
    children: (
      <div className="rounded-2xl border border-dashed border-border p-6">
        RBAC form slot
      </div>
    ),
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "content-ai-chat-forgot-password" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
