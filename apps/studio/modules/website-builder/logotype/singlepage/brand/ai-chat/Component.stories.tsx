import { Component as Logotype } from "../../../index";

import type { Meta, StoryObj } from "@storybook/react";
function Component() {
  return <Logotype variant="brand-ai-chat" />;
}
const meta = {
  id: "modules-website-builder-models-logotype-singlepage-brand-ai-chat",
  title: "Modules/Website-Builder/Logotype/Singlepage/brand/ai-chat",
  component: Component,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
