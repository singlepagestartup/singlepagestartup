import type { Meta, StoryObj } from "@storybook/react";
import { Component as Subject } from "../../../../../../index";
import type { IAccountChangeProps } from "./interface";
function Component(props: IAccountChangeProps) {
  return (
    <Subject
      {...props}
      variant="me-authentication-email-and-password-account-change-default"
    />
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-authentication-email-and-password-account-change-default",
  title:
    "Modules/RBAC/Subject/Singlepage/authentication/email-and-password/account-change/default",
  component: Component,
  args: { email: "alex@example.com", kind: "email" },
  argTypes: { kind: { control: "select", options: ["email", "password"] } },
} satisfies Meta<typeof Component>;
export default meta;
export const Email: StoryObj<typeof meta> = {};
export const Password: StoryObj<typeof meta> = { args: { kind: "password" } };
