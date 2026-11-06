import { Component as Subject } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultSubjectMeCrmFormDefaultProps } from "./Component";

const meta = {
  id: "modules-rbac-models-subject-singlepage-me-crm-module-form-default",
  title: "Modules/RBAC/Subject/Singlepage/me-crm-module-form-default",
  component: Subject,
  args: {
    ...defaultSubjectMeCrmFormDefaultProps,
    variant: "me-crm-module-form-default",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Subject>,
    { variant: "me-crm-module-form-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
