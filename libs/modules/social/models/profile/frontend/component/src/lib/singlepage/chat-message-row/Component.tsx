import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      className={props.className}
      data={props.data}
      language={props.language}
      message={props.message}
      isDeleting={props.isDeleting}
      onEdit={props.onEdit}
      onDelete={props.onDelete}
    />
  );
}
