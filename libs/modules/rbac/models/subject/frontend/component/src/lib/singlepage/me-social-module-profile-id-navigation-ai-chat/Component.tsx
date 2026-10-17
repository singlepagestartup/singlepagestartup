import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      threadsRead={props.threadsRead}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      project={props.project}
      language={props.language}
      threadId={props.threadId}
      selected={props.selected}
    />
  );
}
