import { Component as Subject } from "../../../../../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultSubjectResetPasswordFormDefaultProps } from "./Component";

function Component(
  props: Extract<
    React.ComponentProps<typeof Subject>,
    {
      variant: "me-authentication-email-and-password-reset-password-form-default";
    }
  >,
) {
  return (
    <Subject
      {...props}
      variant="me-authentication-email-and-password-reset-password-form-default"
    />
  );
}

const meta = {
  id: "modules-rbac-models-subject-singlepage-authentication-email-and-password-reset-password-form-default",
  title:
    "Modules/RBAC/Subject/Singlepage/authentication/email-and-password/reset-password-form/default",
  component: Component,
  args: defaultSubjectResetPasswordFormDefaultProps,
} satisfies Meta<typeof Component>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
