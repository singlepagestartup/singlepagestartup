"use client";

import "client-only";

import { factory } from "@sps/shared-frontend-client-api";
import { IComponentProps, IComponentPropsExtended } from "./interface";
import { Component as Skeleton } from "./Skeleton";
import { ReactNode, useEffect, useMemo } from "react";
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

  const ctx = useTableContext();

  const {
    debouncedSearch = "",
    searchField = "id",
    offset = 0,
    limit = 100,
    selectedField = "id",
    setState,
  } = ctx ?? {};

  const params = useMemo(() => {
    const jsonFields = ["title", "subtitle", "description"];
    const field = selectedField ?? searchField ?? "id";
    const value = debouncedSearch?.trim() ?? "";

    if (!value) {
      return {
        ...(props.apiProps?.params ?? {}),
        filters: props.apiProps?.params?.filters,
        offset,
        limit,
      };
    }

    const searchFilters: any[] = [];

    if (field === "id") {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          value,
        );
      searchFilters.push({
        column: "id",
        method: isUuid ? "eq" : "ilike",
        value,
      });
    } else if (jsonFields.includes(field)) {
      searchFilters.push({
        column: field,
        method: "ilike",
        value: JSON.stringify({ ru: value, en: value }),
      });
    } else {
      searchFilters.push({
        column: field,
        method: "ilike",
        value,
      });
    }

    const filters = {
      and: [...(props.apiProps?.params?.filters?.and ?? []), ...searchFilters],
    };

    return {
      ...(props.apiProps?.params ?? {}),
      filters,
      offset,
      limit,
    };
  }, [
    props.apiProps?.params,
    offset,
    limit,
    debouncedSearch,
    selectedField,
    searchField,
  ]);

  const { data: totalData } = props.api.count({
    params: { filters: params.filters },
    options: {
      ...props.apiProps?.options,
      headers: {
        ...props.apiProps?.options?.headers,
        "Cache-Control": "no-store",
      },
    },
  });
  const { data, isLoading } = props.api.find({
    params,
    options: {
      ...props.apiProps?.options,
      headers: {
        ...props.apiProps?.options?.headers,
        "Cache-Control": "no-store",
      },
    },
  });

  useEffect(() => {
    if (typeof totalData !== "number" || !setState) {
      return;
    }

    setState((prev) => {
      return prev.total === totalData ? prev : { ...prev, total: totalData };
    });
  }, [totalData, setState]);

  if (isLoading || !data) {
    return props.Skeleton ?? <Skeleton />;
  }

  return <Child {...props} isServer={false} data={data} />;
}
