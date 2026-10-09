import { Component as SocialModuleProfile } from "../../index";
import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-social-models-profile-singlepage-ai-chat-agent-select",
  title: "Modules/Social/Models/Profile/Singlepage/ai-chat-agent-select",
  component: SocialModuleProfile,
  args: { variant: "ai-chat-agent-select", onChange: () => undefined },
} satisfies Meta<typeof SocialModuleProfile>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
