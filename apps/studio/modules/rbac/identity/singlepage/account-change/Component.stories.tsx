import type { Meta, StoryObj } from "@storybook/react";
import { Component as RbacModuleIdentity } from "../../index";
import type { IAccountChangeProps } from "./Component";
function Example(props: IAccountChangeProps) {
  return <RbacModuleIdentity {...props} variant="account-change" />;
}
const meta = {
  title: "Modules/Rbac/Models/Identity/Singlepage/account-change",
  component: Example,
  args: { email: "alex@example.com", kind: "email" },
  argTypes: { kind: { control: "select", options: ["email", "password"] } },
} satisfies Meta<typeof Example>;
export default meta;
export const Email: StoryObj<typeof meta> = {};
export const Password: StoryObj<typeof meta> = { args: { kind: "password" } };
