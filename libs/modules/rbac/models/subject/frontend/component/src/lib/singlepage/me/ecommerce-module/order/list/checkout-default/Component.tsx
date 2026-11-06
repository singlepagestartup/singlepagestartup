import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <div className="w-fit flex flex-row items-center gap-2 p-5">
      <Subject
        isServer={props.isServer}
        variant="ecommerce-module-order-list-checkout-default"
        dataSource="props"
        data={props.data}
        language={props.language}
        className="w-fit"
      />
    </div>
  );
}
