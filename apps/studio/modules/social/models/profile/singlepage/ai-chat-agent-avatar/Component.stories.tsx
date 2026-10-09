import { Component as SocialModuleProfile } from "../../index";
import type { Meta, StoryObj } from "@storybook/react";
import { productsAgent } from "../ai-chat-agent/index";
const meta = {
  id: "modules-social-models-profile-singlepage-ai-chat-agent-avatar",
  title: "Modules/Social/Models/Profile/Singlepage/ai-chat-agent-avatar",
  component: SocialModuleProfile,
  args: {
    variant: "ai-chat-agent-avatar",
    agent: productsAgent,
    onSelect: () => undefined,
  },
} satisfies Meta<typeof SocialModuleProfile>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
