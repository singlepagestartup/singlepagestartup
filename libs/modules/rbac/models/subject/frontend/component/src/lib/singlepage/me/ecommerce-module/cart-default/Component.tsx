import { Component as ClientComponent } from "./ClientComponent";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={false}
      data={props.data}
      className={props.className}
      language={props.language}
      variant={props.variant}
    />
  );
}
