"use server";

import { publicReadOptions } from "@sps/shared-utils/public-read";
import "server-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/billing/models/currency/sdk/server";
import { Component as Child } from "./Component";

export async function Component(props: IComponentProps) {
  const data = await api.find(
    publicReadOptions({
      ...props.apiProps,
    }),
  );

  if (!data) {
    return <></>;
  }

  return <Child {...props} data={data} />;
}
