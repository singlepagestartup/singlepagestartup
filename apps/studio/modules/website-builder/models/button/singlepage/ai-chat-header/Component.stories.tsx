import { Component as WebsiteBuilderModuleButton } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return (
    <WebsiteBuilderModuleButton variant="ai-chat-header" id="ai-chat-help" />
  );
}
const meta = {
  id: "modules-website-builder-models-button-singlepage-ai-chat-header",
  title: "Modules/Website-Builder/Models/Button/Singlepage/ai-chat-header",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
