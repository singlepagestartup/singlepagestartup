import { AI_CHAT_PROJECTS_PATH } from "@sps/shared-utils";
import { Component as Form } from "../form-default/Component";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <Form
      language={props.language}
      isServer={props.isServer}
      variant="authentication-email-and-password-form-default"
      mode={props.mode}
      successHref={AI_CHAT_PROJECTS_PATH}
    />
  );
}
