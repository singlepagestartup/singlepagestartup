import {
  Component as SocialModuleMessage,
  type IMessageListProps,
} from "../../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { knowledgeAgent } from "../../../../profile/singlepage/agent/overview/ai-chat/index";

function Example(props: IMessageListProps) {
  return <SocialModuleMessage {...props} variant="list-ai-chat" />;
}

const meta = {
  id: "modules-social-models-message-singlepage-list-ai-chat",
  title: "Modules/Social/Models/Message/Singlepage/list/ai-chat",
  component: Example,
  args: {
    threadId: "pottery:thread:document:products",
    messages: [
      {
        id: "products-intro",
        role: "assistant",
        agent: knowledgeAgent,
        text: "Products.md is ready to work on. Discuss this knowledge or request a change.",
      },
    ],
  },
  argTypes: {
    threadId: { control: "text" },
    messages: { control: "object" },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
