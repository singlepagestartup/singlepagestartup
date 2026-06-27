import type { Meta, StoryObj } from "@storybook/react";

import { SubjectMeDelete, defaultSubjectMeDeleteProps } from "./Component";

const meta = {
  title: "Modules/RBAC/Models/Subject/Singlepage/me-delete",
  component: SubjectMeDelete,
  args: defaultSubjectMeDeleteProps,
} satisfies Meta<typeof SubjectMeDelete>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
