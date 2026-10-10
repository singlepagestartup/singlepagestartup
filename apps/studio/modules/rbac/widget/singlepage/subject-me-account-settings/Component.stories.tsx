import type { Meta, StoryObj } from "@storybook/react";

import {
  SubjectMeAccountSettings,
  defaultSubjectMeAccountSettingsProps,
} from "./Component";

const meta = {
  title: "Modules/RBAC/Models/Widget/Singlepage/subject-me-account-settings",
  component: SubjectMeAccountSettings,
  parameters: { layout: "fullscreen" },
  args: defaultSubjectMeAccountSettingsProps,
  argTypes: {
    showTokens: { control: "boolean" },
    initialSection: {
      control: "select",
      options: ["profile", "sign-in", "purchases", "data"],
    },
  },
} satisfies Meta<typeof SubjectMeAccountSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const AIChat: Story = { args: { showTokens: true } };
export const SignIn: Story = { args: { initialSection: "sign-in" } };
