import { Component as Subject } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-rbac-models-subject-singlepage-admin-v2-settings",
  title: "Modules/RBAC/Subject/Singlepage/admin-v2-settings",
  component: Subject,
  parameters: {
    layout: "centered",
  },
  args: { variant: "admin-v2-settings" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Subject>,
    { variant: "admin-v2-settings" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
