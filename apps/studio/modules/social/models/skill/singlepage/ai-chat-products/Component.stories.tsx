import { Component as SocialModuleSkill } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-social-models-skill-singlepage-ai-chat-products",
  title: "Modules/Social/Models/Skill/Singlepage/ai-chat-products",
  component: SocialModuleSkill,
  args: { variant: "ai-chat-products" },
} satisfies Meta<typeof SocialModuleSkill>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
