import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      key={props.data?.id ?? "guest"}
      isServer={false}
      variant={props.variant}
      language={props.language}
      className={props.className}
      data={props.data}
      authenticated={props.authenticated}
    />
  );
}
