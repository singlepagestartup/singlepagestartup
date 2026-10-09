import { Component as WebsiteBuilderModuleButtonsArray } from "../../../index";

import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return (
    <WebsiteBuilderModuleButtonsArray
      variant="header-ai-chat"
      id="ai-chat-help"
    />
  );
}
const meta = {
  id: "modules-website-builder-models-buttons-array-singlepage-header-ai-chat",
  title:
    "Modules/Website-Builder/Models/ButtonsArray/Singlepage/header/ai-chat",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
