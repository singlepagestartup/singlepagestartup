"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/ecommerce/models/widget/sdk/server";

export default async function Server(props: IComponentProps) {
  const data = await api.find(props.apiProps);

  if (!data) {
    return <></>;
  }

  if (props.children) {
    return props.children({ data });
  }

  return <></>;
}
