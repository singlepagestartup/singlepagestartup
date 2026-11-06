"use client";
import "client-only";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  const { data } = api.socialModuleProfileFind({
    id: props.data.id,
    ...props.apiProps,
  });
  return data ? props.children({ data }) : null;
}
