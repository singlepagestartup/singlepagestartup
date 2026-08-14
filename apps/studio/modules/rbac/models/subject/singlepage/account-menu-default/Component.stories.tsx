import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  SubjectAccountMenuDefault,
  defaultSubjectAccountMenuDefaultProps,
} from "./Component";

const meta: Meta<typeof SubjectAccountMenuDefault> = {
  title: "Modules/RBAC/Models/Subject/Singlepage/subject-account-menu-default",
  component: SubjectAccountMenuDefault,
  args: defaultSubjectAccountMenuDefaultProps,
};

export default meta;

type Story = StoryObj<typeof SubjectAccountMenuDefault>;

export const Default: Story = {
  name: "default",
};

export const SignedOut: Story = {
  name: "signed-out",
  args: {
    signedIn: false,
  },
};
