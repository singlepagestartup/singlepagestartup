"use server";

import { publicReadOptions } from "@sps/shared-utils/public-read";
import "server-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/ecommerce/models/order/sdk/server";
import { Component } from "./Component";

export default async function Server(props: IComponentProps) {
  if (!props.data.id) {
    return <></>;
  }

  const data = await api.findById(
    publicReadOptions({
      id: props.data.id,
      ...props.apiProps,
    }),
  );

  if (!data) {
    return <></>;
  }

  return <Component {...props} data={data} />;
}
