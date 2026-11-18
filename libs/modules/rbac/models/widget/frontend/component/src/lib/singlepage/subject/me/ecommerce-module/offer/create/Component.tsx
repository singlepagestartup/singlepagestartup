import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={false}
      variant={props.variant}
      ecommerceModuleStoreId={props.ecommerceModuleStoreId}
      subjectId={props.subjectId}
    />
  );
}
