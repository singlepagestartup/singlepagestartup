"use client";
import "client-only";

import { useEffect } from "react";
import { factory } from "@sps/shared-frontend-client-api";
import { IComponentProps } from "./interface";

export function Component<
  M,
  V,
  A extends { api: ReturnType<typeof factory<M>> },
  CP extends IComponentProps<M, V>,
>(props: CP & A) {
  const { data, isFetching, isLoading } = props.api.find(props.apiProps);

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
