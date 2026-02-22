"use client";
import "client-only";

import { factory } from "@sps/shared-frontend-client-api";
import { IComponentProps } from "./interface";
import { IComponentPropsExtended } from "./interface";
import { Component as Skeleton } from "./Skeleton";
import { Component as HeadlessComponent } from "./ClientComponent";
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
>(props: (CP & Partial<A>) | IComponentProps) {
  if (!("api" in props) || !props.api || !("Component" in props)) {
    return <HeadlessComponent {...(props as IComponentProps)} />;
  }

  const typedProps = props as CP & A;
  const { Component: Child } = typedProps;

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
        ...(typedProps.apiProps?.params ?? {}),
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
      and: [
        ...(typedProps.apiProps?.params?.filters?.and ?? []),
        ...searchFilters,
      ],
    };

    return {
      ...(typedProps.apiProps?.params ?? {}),
      filters,
      offset,
      limit,
    };
  }, [
    typedProps.apiProps?.params,
    offset,
    limit,
    debouncedSearch,
    selectedField,
    searchField,
  ]);

  const { data: totalData, isLoading: isTotalLoading } = typedProps.api.find({
    options: {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  });
  const { data, isLoading } = typedProps.api.find({
    params,
    options: {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  });

  useEffect(() => {
    if (!totalData || !Array.isArray(totalData) || !setState) {
      return;
    }

    setState((prev) => {
      const newTotal = totalData ? totalData.length : 0;

      return { ...prev, total: newTotal };
    });
  }, [totalData, setState]);

  if (isLoading || isTotalLoading || !data) {
    return typedProps.Skeleton ?? <Skeleton />;
  }

  return <Child {...typedProps} isServer={false} data={data} />;
}
