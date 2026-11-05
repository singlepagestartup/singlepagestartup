import type { Meta, StoryObj } from "@storybook/react";
import { Component as Subject } from "../../../../../index";
import type { ISelectMethodProps } from "./interface";
function Component(props: ISelectMethodProps) {
  return (
    <Subject
      {...props}
      key={props.initialMethod}
      variant="me-authentication-select-method-default"
    />
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-authentication-select-method-default",
  title: "Modules/RBAC/Subject/Singlepage/authentication/select-method/default",
  component: Component,
  args: { initialMethod: "email-and-password" },
  argTypes: {
    initialMethod: {
      control: "select",
      options: ["email-and-password", "ethereum-virtual-machine", "oauth"],
    },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
