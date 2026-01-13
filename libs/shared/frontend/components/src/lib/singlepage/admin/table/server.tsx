"use server";
import "server-only";

import { IComponentProps, IComponentPropsExtended } from "./interface";
import { factory } from "@sps/shared-frontend-server-api";

export async function Component<
  M extends { id: string },
  V,
  A extends {
    api: ReturnType<typeof factory<M>>;
    Skeleton: React.ComponentType;
    Component: React.ComponentType<
      IComponentPropsExtended<M, V, IComponentProps<M, V>>
    >;
  },
  CP extends IComponentProps<M, V> & {
    page?: number;
    limit?: number;
    search?: string;
    searchField?: string;
  },
>(props: CP & A) {
  const { Component: Child } = props;

  const filters = {
    and: [
      ...(props.apiProps?.params?.filters?.and ?? []),
      ...(props.search
        ? [
            {
              column: props.searchField ?? "name",
              method: "like",
              value: props.search,
            },
          ]
        : []),
    ],
  };

  const data = await props.api.find({
    ...props.apiProps,
    params: {
      ...(props.apiProps?.params ?? {}),
      filters,
    },
    options: {
      ...props.apiProps?.options,
      headers: {
        "Cache-Control": "no-store",
        ...props.apiProps?.options?.headers,
      },
    },
  });

  if (!data) {
    return <></>;
  }

  return (
    <Child variant={props.variant} isServer={props.isServer} data={data} />
  );
}
