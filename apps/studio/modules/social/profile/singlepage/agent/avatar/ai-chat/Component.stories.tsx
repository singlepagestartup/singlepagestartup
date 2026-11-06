import { Component as Profile } from "../../../../index";
import type { Meta, StoryObj } from "@storybook/react";
import { knowledgeAgent } from "../../id/ai-chat/index";
const meta = {
  id: "modules-social-models-profile-singlepage-agent-avatar-ai-chat",
  title: "Modules/Social/Profile/Singlepage/agent/avatar/ai-chat",
  component: Profile,
  args: {
    variant: "agent-avatar-ai-chat",
    agent: knowledgeAgent,
    onSelect: () => undefined,
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Profile>,
    { variant: "agent-avatar-ai-chat" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
