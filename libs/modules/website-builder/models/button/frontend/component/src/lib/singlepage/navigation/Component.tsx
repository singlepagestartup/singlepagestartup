import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      data={props.data}
      isServer={false}
      variant="navigation"
      language={props.language}
      className={props.className}
    />
  );
}
