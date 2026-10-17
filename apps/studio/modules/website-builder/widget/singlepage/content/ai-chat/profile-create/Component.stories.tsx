import { Component as Widget } from "../../../..";
import type { Meta, StoryObj } from "@storybook/react";
function Component() {
  return (
    <Widget variant="content-ai-chat-profile-create">
      <p className="mt-8 rounded-xl border border-border p-4">
        Subject form slot
      </p>
    </Widget>
  );
}
const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-ai-chat-profile-create",
  title:
    "Modules/Website-Builder/Widget/Singlepage/content/ai-chat/profile-create",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
