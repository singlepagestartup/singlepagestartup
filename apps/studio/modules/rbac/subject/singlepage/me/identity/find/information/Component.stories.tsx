import { Component as Subject } from "../../../../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultSubjectMeIdentityFindInformationProps } from "./Component";

const meta = {
  id: "modules-rbac-models-subject-singlepage-me-identity-find-information",
  title: "Modules/RBAC/Subject/Singlepage/me/identity/find/information",
  component: Subject,
  args: {
    ...defaultSubjectMeIdentityFindInformationProps,
    variant: "me-identity-find-information",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Subject>,
    { variant: "me-identity-find-information" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
