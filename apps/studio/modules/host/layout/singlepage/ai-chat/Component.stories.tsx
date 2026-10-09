import { Component as HostModuleLayout } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return (
    <HostModuleLayout variant="ai-chat">
      <p className="p-5">AI Chat page content slot</p>
    </HostModuleLayout>
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
