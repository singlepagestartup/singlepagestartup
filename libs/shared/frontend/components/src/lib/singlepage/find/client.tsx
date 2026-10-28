"use client";

import { publicReadOptions } from "@sps/shared-utils/public-read";
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
  const { data, isFetching, isLoading } = props.api.find(
    publicReadOptions({
      ...props.apiProps,
      params: {
        ...props.apiProps?.params,
        filters: {
          and: [
            ...(props.apiProps?.params?.filters?.and || []),
            { column: "variant", method: "ne", value: "hidden" },
          ],
        },
      },
    }),
  );

  useEffect(() => {
    if (props.set && typeof props.set === "function") {
      props.set(data);
    }
  }, [data, props]);

  if (
    isLoading ||
    (isFetching && (props.keepDataWhileFetching === false || !data))
  ) {
    return <></>;
  }

  if (props.children) {
    return props.children({ data });
  }

  return <></>;
}
