import type { Meta, StoryObj } from "@storybook/react";
import { Component as Subject } from "../../../../../../index";
import type { IOAuthAuthorizationProps } from "./interface";
function Component(props: IOAuthAuthorizationProps) {
  return (
    <Subject
      {...props}
      key={props.initialState}
      variant="me-authentication-oauth-authorization-default"
    />
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-authentication-oauth-authorization-default",
  title:
    "Modules/RBAC/Subject/Singlepage/authentication/oauth/authorization/default",
  component: Component,
  args: { initialState: "idle" },
  argTypes: {
    initialState: {
      control: "select",
      options: ["idle", "authorize", "complete", "error"],
    },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
