"use server";

import "server-only";

import { IComponentProps } from "./interface";
import { factory } from "@sps/shared-frontend-server-api";

export async function Component<
  M,
  V,
  A extends { api: ReturnType<typeof factory<M>> },
  CP extends IComponentProps<M, V>,
>(props: CP & A) {
  const data = await props.api.find(props.apiProps || {});

  if (!data) {
    return <></>;
  }

  if (props.children) {
    return props.children({ data });
  }

  return <></>;
}
