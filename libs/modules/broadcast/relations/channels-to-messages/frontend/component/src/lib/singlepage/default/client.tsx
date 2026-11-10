"use client";
import "client-only";
import { api } from "@sps/broadcast/relations/channels-to-messages/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const { data, isLoading, error } = api.message({
    id: props.data.id,
    options: props.apiProps?.options,
  });
  if (error) {
    throw error;
  }
  if (isLoading || !data) {
    return null;
  }
  return (
    <ChildComponent {...props} data={data.relation} message={data.message} />
  );
}
