"use client";
import "client-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";

export function Component(props: IComponentProps) {
  const { data } = api.ecommerceModuleOrderQuantity({
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
