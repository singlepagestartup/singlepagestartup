import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";

const meta = {
  id: "modules-social-models-profile-singlepage-ai-chat-project-select",
  title: "Modules/Social/Models/Profile/Singlepage/ai-chat-project-select",
  component: Component,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Empty: StoryObj<typeof meta> = {
  args: { initialProfiles: [] },
};
