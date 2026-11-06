import { Component as Profile } from "../../../../index";
import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-social-models-profile-singlepage-agent-select-ai-chat",
  title: "Modules/Social/Profile/Singlepage/agent/select/ai-chat",
  component: Profile,
  args: { variant: "agent-select-ai-chat", onChange: () => undefined },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Profile>,
    { variant: "agent-select-ai-chat" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
