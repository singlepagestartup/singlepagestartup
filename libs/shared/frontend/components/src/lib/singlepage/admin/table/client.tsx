"use client";
import "client-only";

import { factory } from "@sps/shared-frontend-client-api";
import { IComponentProps, IComponentPropsExtended } from "./interface";
import { Component as Skeleton } from "./Skeleton";
import { ReactNode, useMemo } from "react";
import { useTableContext } from "../table-controller/Context";

export function Component<
  M extends { id?: string },
  V,
  A extends {
    api: ReturnType<typeof factory<M>>;
    Skeleton?: ReactNode;
    Component: React.ComponentType<
      IComponentPropsExtended<M, V, IComponentProps<M, V>>
    >;
  },
  CP extends IComponentProps<M, V>,
>(props: CP & A) {
  const { Component: Child } = props;
  const ctx = useTableContext() ?? {
    debouncedSearch: "",
    searchField: "adminTitle",
    offset: 1,
    limit: 10,
  };

  const params = useMemo(() => {
    const jsonFields = ["title", "subtitle", "description"];
    const searchField = ctx.searchField ?? "adminTitle";
    const searchValue = ctx.debouncedSearch?.trim() ?? "";

    if (!searchValue) {
      return {
        ...(props.apiProps?.params ?? {}),
        offset: ctx.offset ?? 1,
        limit: ctx.limit ?? 10,
      };
    }

    const searchFilters: any[] = [];

    if (searchField === "id") {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          searchValue,
        );
      searchFilters.push({
        column: "id",
        method: isUuid ? "eq" : "like",
        value: searchValue,
      });
    } else if (jsonFields.includes(searchField)) {
      searchFilters.push({
        column: searchField,
        method: "like",
        value: JSON.stringify({ ru: searchValue, en: searchValue }),
      });
    } else {
      searchFilters.push({
        column: searchField,
        method: "like",
        value: searchValue,
      });
    }

    const filters = {
      and: [...(props.apiProps?.params?.filters?.and ?? []), ...searchFilters],
    };

    return {
      ...(props.apiProps?.params ?? {}),
      filters,
      offset: ctx.offset ?? 1,
      limit: ctx.limit ?? 10,
    };
  }, [props.apiProps?.params, ctx]);

  const { data, isLoading } = props.api.find({ params });

  if (isLoading || !data) {
    return props.Skeleton ?? <Skeleton />;
  }

  return <Child {...props} isServer={false} data={data} />;
}
