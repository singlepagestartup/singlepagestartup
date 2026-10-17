import { Component as Message } from "../../../index";

import { documentAgent } from "../../../../profile/singlepage/agent/id/ai-chat/resolver";
import type { Meta, StoryObj } from "@storybook/react";

function Component() {
  return (
    <Message
      variant="id-ai-chat"
      message={{
        id: "brief-intro",
        role: "assistant",
        text: "Who is the workshop for?",
      }}
      agent={documentAgent("brief")}
      showContext
      onSelect={() => {}}
    />
  );
}

const meta = {
  id: "modules-social-models-message-singlepage-id-ai-chat",
  title: "Modules/Social/Message/Singlepage/id/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
