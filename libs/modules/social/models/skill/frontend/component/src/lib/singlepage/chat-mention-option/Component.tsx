import type { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={false}
      data={props.data}
      language={props.language}
      className={props.className}
      editOnClick={props.editOnClick}
      mentionPrefix={props.mentionPrefix}
      onEdit={props.onEdit}
    />
  );
}
