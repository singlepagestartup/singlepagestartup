"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/billing/models/currency/sdk/server";
import { Component as Child } from "./Component";

export async function Component(props: IComponentProps) {
  const data = await api.find({
    ...props.apiProps,
  });

  if (!data) {
    return <></>;
  }

  return <Child {...props} data={data} />;
}
