"use client";
import "client-only";

import { Component } from "./Component";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Skeleton } from "./Skeleton";
import { Error } from "./Error";
import { IComponentProps } from "./interface";
import { api } from "@sps/sps-host/models/widget/sdk/client";

export default function Client(props: IComponentProps) {
  const { data, isFetching, isLoading } = api.findById({
    id: props.data.id,
    ...props.apiProps,
  });

  if (isFetching || isLoading || !data) {
    return <Skeleton {...props} />;
  }

  return (
    <ErrorBoundary fallback={Error}>
      <Component {...props} data={data} />
    </ErrorBoundary>
  );
}
