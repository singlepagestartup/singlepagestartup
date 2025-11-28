"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/server";

export async function Component(props: IComponentProps) {
  const data = await api.ecommerceModuleOrderTotal({
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
