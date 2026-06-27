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
} satisfies Meta<typeof SubjectMeAccountSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
