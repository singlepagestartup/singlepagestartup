import { Component as ButtonsArray } from "../../../index";

import type { Meta, StoryObj } from "@storybook/react";
function Component() {
  return <ButtonsArray variant="navbar-ai-chat" id="ai-chat-help" />;
}
const meta = {
  id: "modules-website-builder-models-buttons-array-singlepage-navbar-ai-chat",
  title: "Modules/Website-Builder/ButtonsArray/Singlepage/navbar/ai-chat",
  component: Component,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
