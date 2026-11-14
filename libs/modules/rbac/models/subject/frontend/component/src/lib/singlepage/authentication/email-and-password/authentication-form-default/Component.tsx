import { Component as Form } from "../form-default/Component";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <Form
      language={props.language}
      isServer={props.isServer}
      className={props.className}
      variant="authentication-email-and-password-form-default"
      mode="authentication"
    />
  );
}
