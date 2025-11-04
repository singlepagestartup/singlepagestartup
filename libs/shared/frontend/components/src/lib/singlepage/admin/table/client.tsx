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

  const { data: totalData, isLoading: isTotalLoading } = props.api.find({});
  const { data, isLoading } = props.api.find({ params });

  useEffect(() => {
    if (!totalData || !Array.isArray(totalData) || !setState) {
      return;
    }

    setState((prev) => {
      const newTotal = totalData ? totalData.length : 0;

      return { ...prev, total: newTotal };
    });
  }, [totalData, setState]);

  if (isLoading || !data) {
    return props.Skeleton ?? <Skeleton />;
  }

  return <Child {...props} isServer={false} data={data} />;
}
