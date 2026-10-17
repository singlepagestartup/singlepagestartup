"use client";
import "client-only";

import { api as orderApi } from "@sps/ecommerce/models/order/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const totals = orderApi.total({
    id: props.data.id,
    options: props.apiProps?.options,
  });

  return (
    <ChildComponent
      isServer={false}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      totals={totals.data}
      totalsPending={totals.isPending}
      totalsError={totals.isError}
    />
  );
}
