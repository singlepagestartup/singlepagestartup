import type { Meta, StoryObj } from "@storybook/react";

import {
  SubjectMeCrmFormDefault,
  defaultSubjectMeCrmFormDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/RBAC/Models/Subject/Singlepage/me-crm-form-deafult",
  component: SubjectMeCrmFormDefault,
  args: defaultSubjectMeCrmFormDefaultProps,
} satisfies Meta<typeof SubjectMeCrmFormDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
