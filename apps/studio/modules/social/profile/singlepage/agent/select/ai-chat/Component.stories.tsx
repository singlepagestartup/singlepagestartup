import { Component as SocialModuleProfile } from "../../../../index";
import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-social-models-profile-singlepage-agent-select-ai-chat",
  title: "Modules/Social/Models/Profile/Singlepage/agent/select/ai-chat",
  component: SocialModuleProfile,
  args: { variant: "agent-select-ai-chat", onChange: () => undefined },
} satisfies Meta<typeof SocialModuleProfile>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
