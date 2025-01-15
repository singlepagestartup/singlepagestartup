"use client";
import "client-only";

import { Component } from "./Component";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Skeleton } from "./Skeleton";
import { Error } from "./Error";
import { IComponentProps } from "./interface";
import { api } from "@sps/website-builder/models/modal/sdk/client";

export default function Client(props: IComponentProps) {
  const { data, isFetching, isLoading } = api.find();

  if (isFetching || isLoading || !data) {
    return <Skeleton />;
  }

  return (
    <ErrorBoundary fallback={Error}>
      <Component {...props} data={data} />
    </ErrorBoundary>
  );
}
