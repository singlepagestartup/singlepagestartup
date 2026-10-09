import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return (
    <Component>
      <p className="p-5">AI Chat page content slot</p>
    </Component>
  );
}
const meta = {
  id: "modules-host-models-layout-singlepage-ai-chat",
  title: "Modules/Host/Models/Layout/Singlepage/ai-chat",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
