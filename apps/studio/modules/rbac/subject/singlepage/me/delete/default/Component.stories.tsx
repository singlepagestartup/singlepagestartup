import { Component as Subject } from "../../../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultSubjectMeDeleteProps } from "./Component";

const meta = {
  id: "modules-rbac-models-subject-singlepage-me-delete",
  title: "Modules/RBAC/Subject/Singlepage/me/delete/default",
  component: Subject,
  args: { ...defaultSubjectMeDeleteProps, variant: "me-delete" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Subject>, { variant: "me-delete" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
