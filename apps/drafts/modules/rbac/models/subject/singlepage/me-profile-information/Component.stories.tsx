import type { Meta, StoryObj } from "@storybook/react";

import {
  SubjectMeProfileInformation,
  defaultSubjectMeProfileInformationProps,
} from "./Component";

const meta = {
  title: "Modules/RBAC/Models/Subject/Singlepage/me-profile-information",
  component: SubjectMeProfileInformation,
  args: defaultSubjectMeProfileInformationProps,
} satisfies Meta<typeof SubjectMeProfileInformation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
