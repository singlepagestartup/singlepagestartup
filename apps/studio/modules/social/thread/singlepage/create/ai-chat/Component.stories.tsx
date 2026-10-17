import { Component as Thread } from "../../../index";

import type { Meta, StoryObj } from "@storybook/react";

function Component() {
  return (
    <Thread variant="create-ai-chat">
      <p className="p-6">Subject thread creation form slot</p>
    </Thread>
  );
}

const meta = {
  id: "modules-social-models-thread-singlepage-create-ai-chat",
  title: "Modules/Social/Thread/Singlepage/create/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
