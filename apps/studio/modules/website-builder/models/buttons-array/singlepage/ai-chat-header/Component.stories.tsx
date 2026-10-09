import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return <Component id="ai-chat-help" />;
}
const meta = {
  id: "modules-website-builder-models-buttons-array-singlepage-ai-chat-header",
  title:
    "Modules/Website-Builder/Models/Buttons-Array/Singlepage/ai-chat-header",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
