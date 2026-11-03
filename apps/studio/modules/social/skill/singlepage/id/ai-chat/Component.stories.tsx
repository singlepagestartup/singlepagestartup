import { Component as Skill } from "../../../index";

import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-social-models-skill-singlepage-id-ai-chat",
  title: "Modules/Social/Skill/Singlepage/id/ai-chat",
  component: Skill,
  args: { variant: "id-ai-chat" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Skill>, { variant: "id-ai-chat" }>
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
