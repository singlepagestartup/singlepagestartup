"use server";

import "server-only";
import { api } from "@sps/broadcast/relations/channels-to-messages/sdk/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";

export async function Component(props: IComponentProps) {
  const data = await api.message({
    id: props.data.id,
    options: props.apiProps?.options,
  });
  if (!data) {
    return null;
  }
  return (
    <ChildComponent {...props} data={data.relation} message={data.message} />
  );
}
