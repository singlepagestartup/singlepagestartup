"use client";
import "client-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/ecommerce/relations/orders-to-products/sdk/client";
import { Component as Child } from "./Component";

export function Component(props: IComponentProps) {
  const { data } = api.total({
    id: props.data.id,
    ...props.apiProps,
  });

  if (!data) {
    return null;
  }

  return <Child {...props} data={data} />;
}
