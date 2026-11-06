import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      data={props.data}
      variant={props.variant}
      className={props.className}
      language={props.language}
      form={props.form}
      disabled={props.disabled}
      path={props.path}
    />
  );
}
