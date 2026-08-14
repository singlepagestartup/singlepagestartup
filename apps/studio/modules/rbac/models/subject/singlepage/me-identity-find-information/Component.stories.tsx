import type { Meta, StoryObj } from "@storybook/react";

import {
  SubjectMeIdentityFindInformation,
  defaultSubjectMeIdentityFindInformationProps,
} from "./Component";

const meta = {
  title: "Modules/RBAC/Models/Subject/Singlepage/me-identity-find-information",
  component: SubjectMeIdentityFindInformation,
  args: defaultSubjectMeIdentityFindInformationProps,
} satisfies Meta<typeof SubjectMeIdentityFindInformation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
