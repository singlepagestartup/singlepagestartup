import { Component as WebsiteBuilderModuleLogotype } from "../../../index";

import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return <WebsiteBuilderModuleLogotype variant="brand-ai-chat" />;
}
const meta = {
  id: "modules-website-builder-models-logotype-singlepage-brand-ai-chat",
  title: "Modules/Website-Builder/Models/Logotype/Singlepage/brand/ai-chat",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
