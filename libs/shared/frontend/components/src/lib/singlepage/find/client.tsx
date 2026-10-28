"use client";
import "client-only";

import { useEffect, type ReactNode } from "react";
import { factory } from "@sps/shared-frontend-client-api";
import { IComponentProps } from "./interface";

export function Component<
  M,
  V,
  A extends { api: ReturnType<typeof factory<M>>; Skeleton?: ReactNode },
  CP extends IComponentProps<M, V>,
>(props: CP & A) {
  const { data, isFetching, isLoading } = props.api.find(props.apiProps);

  useEffect(() => {
    if (props.set && typeof props.set === "function") {
      props.set(data);
    }
  }, [data, props]);

  if (
    isLoading ||
    (isFetching && (props.keepDataWhileFetching === false || !data))
  ) {
    return props.Skeleton ?? props.skeleton ?? <></>;
  }

  if (props.children) {
    return props.children({ data });
  }

  return <></>;
}
