import { Component as WebsiteBuilderModuleLogotype } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return <WebsiteBuilderModuleLogotype variant="ai-chat" />;
}
const meta = {
  id: "modules-website-builder-models-logotype-singlepage-ai-chat",
  title: "Modules/Website-Builder/Models/Logotype/Singlepage/ai-chat",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
