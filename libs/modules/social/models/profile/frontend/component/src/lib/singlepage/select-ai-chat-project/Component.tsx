import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      createHref={props.createHref}
      pending={props.pending}
      empty={props.empty}
      error={props.error}
      onRetry={props.onRetry}
    />
  );
}
