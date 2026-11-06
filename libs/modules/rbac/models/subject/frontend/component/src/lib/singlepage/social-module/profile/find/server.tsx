"use server";
import "server-only";
import { api } from "@sps/rbac/models/subject/sdk/server";
import type { IComponentProps } from "./interface";
export async function Component(props: IComponentProps) {
  const data = await api.socialModuleProfileFind({
    id: props.data.id,
    ...props.apiProps,
  });
  return data ? props.children({ data }) : null;
}
