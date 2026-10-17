import { Component as ClientComponent } from "../form-ai-chat/ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      placeholder={props.placeholder}
      onSave={props.onSave}
      onDiscuss={props.onDiscuss}
      attachments={props.attachments}
      onAttach={props.onAttach}
    />
  );
}
