"use client";
import "client-only";

import { Component } from "./Component";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Skeleton } from "./Skeleton";
import { Error } from "./Error";
import { IComponentProps } from "./interface";
import { api } from "@sps/crm/models/customer/sdk/client";
import { useEffect } from "react";

export default function Client(props: IComponentProps) {
  const { data, isFetching, isLoading } = api.findById({
    id: props.id,
  });

  useEffect(() => {
    if (props.set && typeof props.set === "function") {
      props.set(data);
    }
  }, [data, props]);

  if (isFetching || isLoading) {
    return <></>;
  }

  if (props.children) {
    return props.children({ data });
  }

  return <></>;
}
