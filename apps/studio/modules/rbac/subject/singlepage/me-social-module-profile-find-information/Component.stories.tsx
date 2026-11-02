import { Component as Subject } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultSubjectMeSocialModuleProfileFindInformationProps } from "./Component";

const meta = {
  id: "modules-rbac-models-subject-singlepage-me-social-module-profile-find-information",
  title:
    "Modules/RBAC/Subject/Singlepage/me-social-module-profile-find-information",
  component: Subject,
  args: {
    ...defaultSubjectMeSocialModuleProfileFindInformationProps,
    variant: "me-social-module-profile-find-information",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Subject>,
    { variant: "me-social-module-profile-find-information" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
