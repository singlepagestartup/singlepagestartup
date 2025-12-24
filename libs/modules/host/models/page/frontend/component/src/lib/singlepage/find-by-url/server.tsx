"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/host/models/page/sdk/server";

export default async function Server(props: IComponentProps) {
  const data = await api
    .findByUrl({
      url: props.url,
      catchErrors: true,
    })
    .catch((error) => {
      //
    });

  if (!props.children || typeof props.children !== "function") {
    return;
  }

  return props.children({ data: data || undefined });
}
