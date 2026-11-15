import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={false}
      className={props.className}
      data={props.data}
      language={props.language}
      onEdit={props.onEdit}
      onRemove={props.onRemove}
    />
  );
}
