"use server";
import "server-only";

import { ErrorBoundary } from "@sps/ui-adapter";
import { IComponentProps } from "./interface";
import { Error } from "./Error";
import { api } from "@sps/host/models/page/sdk/server";
import { Component } from "./Component";

export default async function Server(props: IComponentProps) {
  const data = await api.findByUrl({
    url: props.url,
    catchErrors: true,
  });

  if (!props.children || typeof props.children !== "function") {
    return <></>;
  }

  return props.children({ data });
}
