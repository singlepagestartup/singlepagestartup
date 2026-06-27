import type { Meta, StoryObj } from "@storybook/react";

import {
  SubjectMeInformation,
  defaultSubjectMeInformationProps,
} from "./Component";

const meta = {
  title: "Modules/RBAC/Models/Subject/Singlepage/me-information",
  component: SubjectMeInformation,
  args: defaultSubjectMeInformationProps,
} satisfies Meta<typeof SubjectMeInformation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
