import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      language={props.language}
      order={props.order}
      store={props.store}
    />
  );
}
