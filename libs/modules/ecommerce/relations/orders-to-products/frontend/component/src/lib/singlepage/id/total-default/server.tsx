"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/ecommerce/relations/orders-to-products/sdk/server";

export async function Component(props: IComponentProps) {
  const data = await api.total({
    id: props.data.id,
    ...props.apiProps,
  });

  if (!data) {
    return null;
  }

  if (props.children) {
    return props.children({ data });
  }

  return <></>;
}
