import { Component as SocialModuleSkill } from "../../../index";

import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-social-models-skill-singlepage-overview-ai-chat",
  title: "Modules/Social/Models/Skill/Singlepage/overview/ai-chat",
  component: SocialModuleSkill,
  args: { variant: "overview-ai-chat" },
} satisfies Meta<typeof SocialModuleSkill>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
