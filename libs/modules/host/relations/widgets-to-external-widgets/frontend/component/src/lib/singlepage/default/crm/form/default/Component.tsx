import { Component as ClientComponent } from "./ClientComponent";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel as IForm } from "@sps/crm/models/form/sdk/model";

export function Component(
  props: ISpsComponentBase & {
    form: IForm;
    language: string;
  },
) {
  return (
    <ClientComponent
      isServer={props.isServer}
      form={props.form}
      className={props.className}
      skeleton={props.skeleton}
      language={props.language}
    />
  );
}
