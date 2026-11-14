import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      form={props.form}
      name={props.name}
      field={props.field}
      type={props.type}
      placeholder={props.placeholder}
      className={props.className}
    />
  );
}
