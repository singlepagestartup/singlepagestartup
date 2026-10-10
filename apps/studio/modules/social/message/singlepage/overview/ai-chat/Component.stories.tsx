import { Component as SocialModuleMessage } from "../../../index";

import { documentAgent } from "../../../../../../workspace/utils/products/ai-chat-agent-resolver";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  return (
    <SocialModuleMessage
      variant="overview-ai-chat"
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
  id: "modules-social-models-message-singlepage-overview-ai-chat",
  title: "Modules/Social/Models/Message/Singlepage/overview/ai-chat",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
