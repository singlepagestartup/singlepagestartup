import { Component as WebsiteBuilderModuleButton } from "../../../index";

import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return (
    <WebsiteBuilderModuleButton variant="navbar-ai-chat" id="ai-chat-help" />
  );
}
const meta = {
  id: "modules-website-builder-models-button-singlepage-navbar-ai-chat",
  title: "Modules/Website-Builder/Models/Button/Singlepage/navbar/ai-chat",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
