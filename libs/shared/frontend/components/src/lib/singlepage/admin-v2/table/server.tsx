"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { IComponentPropsExtended } from "./interface";
import { factory } from "@sps/shared-frontend-server-api";
import { Component as HeadlessComponent } from "./ClientComponent";

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
>(props: (CP & Partial<A>) | IComponentProps) {
  if (!("api" in props) || !props.api || !("Component" in props)) {
    return <HeadlessComponent {...(props as IComponentProps)} />;
  }

  const typedProps = props as CP & A;
  const { Component: Child } = typedProps;

  const filters = {
    and: [
      ...(typedProps.apiProps?.params?.filters?.and ?? []),
      ...(typedProps.search
        ? [
            {
              column: typedProps.searchField ?? "name",
              method: "like",
              value: typedProps.search,
            },
          ]
        : []),
    ],
  };

  const data = await typedProps.api.find({
    ...typedProps.apiProps,
    params: {
      ...(typedProps.apiProps?.params ?? {}),
      filters,
    },
    options: {
      ...typedProps.apiProps?.options,
      headers: {
        "Cache-Control": "no-store",
        ...typedProps.apiProps?.options?.headers,
      },
    },
  });

  if (!data) {
    return <></>;
  }

  return (
    <Child
      variant={typedProps.variant}
      isServer={typedProps.isServer}
      data={data}
    />
  );
}
