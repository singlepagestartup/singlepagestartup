import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      language={props.language}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      title={props.title}
      content={props.content}
      placeholder={props.placeholder}
      onSave={props.onSave}
      onDiscuss={props.onDiscuss}
      attachments={props.attachments}
      onAttach={props.onAttach}
    />
  );
}
