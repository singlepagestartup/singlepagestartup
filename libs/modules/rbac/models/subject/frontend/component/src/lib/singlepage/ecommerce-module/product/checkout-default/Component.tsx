import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      variant={props.variant}
      className={props.className}
      product={props.product}
      data={props.data}
      language={props.language}
      store={props.store}
    />
  );
}
