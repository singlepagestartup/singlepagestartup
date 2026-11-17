import type { IComponentProps } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentProps) {
  return (
    <ClientComponent
      stores={props.stores}
      products={props.products}
      draft={props.draft}
      actorRole={props.actorRole}
      onSave={props.onSave}
    />
  );
}
