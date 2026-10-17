import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      sourcesRead={props.sourcesRead}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      project={props.project}
      thread={props.thread}
      target={props.target}
      onTargetChange={props.onTargetChange}
    />
  );
}
