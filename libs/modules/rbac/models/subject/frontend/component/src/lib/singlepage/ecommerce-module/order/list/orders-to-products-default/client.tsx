"use client";
import "client-only";

import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";

export function Component(props: IComponentProps) {
  const { data } = subjectApi.ecommerceModuleOrderOrdersToProducts({
    id: props.data.id,
    ...props.apiProps,
  });

  if (!data) {
    return null;
  }

  return <ChildComponent {...props} data={data} />;
}
