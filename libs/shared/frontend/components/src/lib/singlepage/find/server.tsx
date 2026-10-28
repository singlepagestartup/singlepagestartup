"use server";

import { publicReadOptions } from "@sps/shared-utils/public-read";
import "server-only";

import { IComponentProps } from "./interface";
import { factory } from "@sps/shared-frontend-server-api";

export async function Component<
  M,
  V,
  A extends { api: ReturnType<typeof factory<M>> },
  CP extends IComponentProps<M, V>,
>(props: CP & A) {
  const data = await props.api.find(
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

  if (!data) {
    return <></>;
  }

  if (props.children) {
    return props.children({ data });
  }

  return <></>;
}
