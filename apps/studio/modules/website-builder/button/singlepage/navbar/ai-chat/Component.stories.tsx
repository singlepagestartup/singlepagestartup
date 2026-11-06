import { Component as Button } from "../../../index";

import type { Meta, StoryObj } from "@storybook/react";
function Component() {
  return <Button variant="navbar-ai-chat" id="ai-chat-help" />;
}
const meta = {
  id: "modules-website-builder-models-button-singlepage-navbar-ai-chat",
  title: "Modules/Website-Builder/Button/Singlepage/navbar/ai-chat",
  component: Component,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
