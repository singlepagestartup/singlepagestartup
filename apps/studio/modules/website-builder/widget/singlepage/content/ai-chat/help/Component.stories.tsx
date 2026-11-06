import { Component as Widget } from "../../../../index";
import type { Meta, StoryObj } from "@storybook/react";
function Component() {
  return (
    <Widget variant="content-ai-chat-help">
      <div className="text-sm text-muted-foreground">Support form slot</div>
    </Widget>
  );
}
const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-ai-chat-help",
  title: "Modules/Website-Builder/Widget/Singlepage/content/ai-chat/help",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
