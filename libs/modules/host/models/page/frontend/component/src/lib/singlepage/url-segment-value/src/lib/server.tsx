"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/host/models/page/sdk/server";

export default async function Server(props: IComponentProps) {
  const data = await api.urlSegmentValue({
    segment: props.segment,
    url: props.hostUrl,
  });

  if (!data && props.children) {
    return props.children({ data: undefined });
  }

  if (props.children) {
    return props.children({ data });
  }

  return <></>;
}
