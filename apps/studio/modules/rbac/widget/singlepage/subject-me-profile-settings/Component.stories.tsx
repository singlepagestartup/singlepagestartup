import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultSubjectMeProfileSettingsProps } from "./Component";

const meta = {
  id: "modules-rbac-models-widget-singlepage-subject-me-profile-settings",
  title: "Modules/RBAC/Widget/Singlepage/subject-me-profile-settings",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: {
    ...defaultSubjectMeProfileSettingsProps,
    variant: "subject-me-profile-settings",
  },
  argTypes: {
    showTokens: { control: "boolean" },
    initialSection: {
      control: "select",
      options: ["profile", "sign-in", "purchases", "data"],
    },
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "subject-me-profile-settings" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const AIChat: Story = { args: { showTokens: true } };
export const SignIn: Story = { args: { initialSection: "sign-in" } };
