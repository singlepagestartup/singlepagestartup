"use client";
import "client-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Component as Child } from "./Component";

export function Component(props: IComponentProps) {
  const { data } = api.ecommerceModuleOrderTotal({
    id: props.data.id,
    ...props.apiProps,
  });

  if (!data) {
    return null;
  }

  return <Child {...props} data={data} />;
}
