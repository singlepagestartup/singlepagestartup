"use client";

import { publicReadOptions } from "@sps/shared-utils/public-read";
import "client-only";

import { Component as ChildComponent } from "./Component";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Skeleton } from "./Skeleton";
import { Error } from "./Error";
import { IComponentProps } from "./interface";
import { api } from "@sps/broadcast/models/channel/sdk/client";

export function Component(props: IComponentProps) {
  const { data, isFetching, isLoading } = api.findById(
    publicReadOptions({
      id: props.data.id,
      ...props.apiProps,
    }),
  );

  if (isFetching || isLoading || !data) {
    return <Skeleton />;
  }

  return (
    <ErrorBoundary>
      <ChildComponent {...props} data={data} />
    </ErrorBoundary>
  );
}
