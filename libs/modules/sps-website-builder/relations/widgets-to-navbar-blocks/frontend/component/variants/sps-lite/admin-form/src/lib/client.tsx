"use client";
import "client-only";

import { Component } from "./Component";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Skeleton } from "./Skeleton";
import { Error } from "./Error";
import { IComponentProps } from "./interface";
import { api } from "@sps/sps-website-builder/relations/widgets-to-navbar-blocks/frontend/api/client";

export default function Client(props: IComponentProps) {
  const { data, isFetching, isLoading } = api.findById({
    id: props.data?.id,
    ...props.apiProps,
  });

  if (isFetching || isLoading || (!data && props.data?.id)) {
    return <Skeleton {...props} />;
  }

  return (
    <ErrorBoundary fallback={Error}>
      <Component {...props} data={data} />
    </ErrorBoundary>
  );
}
