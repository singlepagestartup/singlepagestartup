"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/rbac/relations/subjects-to-notification-module-topics/sdk/server";

export default async function Server(props: IComponentProps) {
  const data = await api.find(props.apiProps);

  if (!data) {
    return <></>;
  }

  if (props.children) {
    return props.children({ data });
  }

  return <></>;
}
