import { Component as Form } from "../form-ai-chat/Component";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  return (
    <Form
      language={props.language}
      isServer={props.isServer}
      variant="authentication-email-and-password-form-ai-chat"
      mode="authentication"
    />
  );
}
