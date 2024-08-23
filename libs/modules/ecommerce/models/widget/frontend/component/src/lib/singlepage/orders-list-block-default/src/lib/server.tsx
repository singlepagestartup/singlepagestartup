"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/ecommerce/models/widget/sdk/server";
import { Component } from "./Component";

export default async function Server(props: IComponentProps) {
  if (!props.data.id) {
    return <></>;
  }

  const data = await api.findById({
    id: props.data.id,
    ...props.apiProps,
  });

  if (!data) {
    return <></>;
  }

  return <Component {...props} data={data} />;
}
