import { Component as Subject } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultSubjectMeInformationProps } from "./Component";

const meta = {
  id: "modules-rbac-models-subject-singlepage-me-information",
  title: "Modules/RBAC/Subject/Singlepage/me-information",
  component: Subject,
  args: { ...defaultSubjectMeInformationProps, variant: "me-information" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Subject>, { variant: "me-information" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
