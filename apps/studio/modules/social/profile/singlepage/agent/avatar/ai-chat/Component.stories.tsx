import { Component as SocialModuleProfile } from "../../../../index";
import type { Meta, StoryObj } from "@storybook/react";
import { knowledgeAgent } from "../../overview/ai-chat/index";
const meta = {
  id: "modules-social-models-profile-singlepage-agent-avatar-ai-chat",
  title: "Modules/Social/Models/Profile/Singlepage/agent/avatar/ai-chat",
  component: SocialModuleProfile,
  args: {
    variant: "agent-avatar-ai-chat",
    agent: knowledgeAgent,
    onSelect: () => undefined,
  },
} satisfies Meta<typeof SocialModuleProfile>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
