"use client";

import { publicReadOptions } from "@sps/shared-utils/public-read";
import "client-only";

import { Component } from "./Component";
import { Skeleton } from "./Skeleton";
import { IComponentProps } from "./interface";
import { api } from "@sps/ecommerce/relations/orders-to-products/sdk/client";

export default function Client(props: IComponentProps) {
  const { data, isLoading } = api.findById(
    publicReadOptions({
      id: props.data.id,
      ...props.apiProps,
    }),
  );

  if (isLoading || !data) {
    return <Skeleton />;
  }

  return <Component {...props} isServer={false} data={data} />;
}
