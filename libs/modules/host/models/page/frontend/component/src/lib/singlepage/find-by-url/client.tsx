"use client";
import "client-only";

import { Skeleton } from "./Skeleton";
import { IComponentProps } from "./interface";
import { api } from "@sps/host/models/page/sdk/client";

export default function Client(props: IComponentProps) {
  const { data, isLoading } = api.findByUrl({
    language: props.language,
    url: props.url,
  });

  if (isLoading) {
    return <Skeleton />;
  }

  if (!props.children) {
    return <></>;
  }

  return props.children({ data });
}
