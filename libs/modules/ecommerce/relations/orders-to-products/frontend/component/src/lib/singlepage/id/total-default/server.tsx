"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { Component as Child } from "./Component";

export async function Component(props: IComponentProps) {
  const data = await api.total({
    id: props.data.id,
    ...props.apiProps,
  });

  if (!data) {
    return null;
  }

  return <Child {...props} data={data} />;
}
