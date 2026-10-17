import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      variant={props.variant}
      type={props.type}
      title={props.title}
      description={props.description}
      actionLabel={props.actionLabel}
      persistent={props.persistent}
      duration={props.duration}
      position={props.position}
      appearance={props.appearance}
    />
  );
}
