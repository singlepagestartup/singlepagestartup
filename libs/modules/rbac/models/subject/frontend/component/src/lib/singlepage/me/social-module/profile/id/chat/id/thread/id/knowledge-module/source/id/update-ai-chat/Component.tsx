import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      language={props.language}
      attachmentsRead={props.attachmentsRead}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      project={props.project}
      source={props.source}
      onDiscuss={props.onDiscuss}
    />
  );
}
