"use client";
import "client-only";

import { cn } from "@sps/shared-frontend-client-utils";
import { FormField } from "@sps/ui-adapter";
import { IComponentPropsExtended, IComponentProps } from "./interface";
import { getNestedValue } from "@sps/shared-utils";
import { factory } from "@sps/shared-frontend-client-api";
import { Component as Skeleton } from "./Skeleton";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";

type TSelectRenderProps<M extends { id?: string }, V> = IComponentPropsExtended<
  M,
  V,
  IComponentProps<M, V>
> & {
  label?: string;
  module: string;
  name: string;
  type?: "model" | "relation";
  renderFunction?: (entity: M) => any;
};

type TSelectContainerProps<M extends { id?: string }, V> = IComponentProps<
  M,
  V
> & {
  api: ReturnType<typeof factory<M>>;
  Skeleton?: ReactNode;
  Component: React.ComponentType<
    IComponentPropsExtended<M, V, IComponentProps<M, V>>
  >;
};

function isContainerProps<M extends { id?: string }, V>(
  props: unknown,
): props is TSelectContainerProps<M, V> {
  return Boolean(
    props &&
      typeof props === "object" &&
      "api" in props &&
      "Component" in props &&
      !("data" in props),
  );
}

function SelectInputView<M extends { id?: string }, V>(
  props: TSelectRenderProps<M, V>,
) {
  return (
    <div
      data-module={props.module}
      data-variant={props.variant}
      className={cn("w-full", props.className)}
      {...(props.type === "relation"
        ? {
            "data-relation": props.name,
          }
        : {
            "data-model": props.name,
          })}
    >
      <FormField
        ui="shadcn"
        type="select-with-search"
        name={props.formFieldName}
        label={props.label}
        form={props.form}
        placeholder={`Select ${props.name}`}
        searchValue={props.searchValue}
        onSearchValueChange={props.onSearchValueChange}
        disableClientFilter={true}
        isLoading={props.isSearching}
        options={props.data.map((entity: any) => {
          if (props.renderFunction && typeof props.renderField === "string") {
            const renderValue = getNestedValue(entity, props.renderField);

            if (typeof renderValue === "string") {
              return [
                entity.id || "",
                renderValue,
                props.renderFunction(entity),
              ];
            }
          }

          if (props.renderField && entity[props.renderField]) {
            const renderValue = entity[props.renderField];
            if (typeof renderValue === "string") {
              return [entity.id || "", renderValue];
            }
          }

          if (typeof props.renderField === "string") {
            const renderValue = getNestedValue(entity, props.renderField);

            if (typeof renderValue === "string") {
              return [entity.id || "", renderValue];
            }
          }

          return [entity.id || "", entity.id || ""];
        })}
      />
    </div>
  );
}

function SelectInputDataLoader<M extends { id?: string }, V>(
  props: TSelectContainerProps<M, V>,
) {
  const { Component: Child, api, Skeleton: _Skeleton, ...restProps } = props;
  const childProps = restProps as unknown as IComponentProps<M, V>;
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const selectedValue = useWatch({
    control: childProps.form.control,
    name: childProps.formFieldName,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, props.searchDebounceMs ?? 300);

    return () => clearTimeout(timeout);
  }, [searchValue, props.searchDebounceMs]);

  const baseParams = childProps.apiProps?.params ?? {};
  const normalizedSearch = debouncedSearchValue.trim();
  const searchField =
    props.searchField ||
    (typeof childProps.renderField === "string"
      ? childProps.renderField
      : "id");
  const parsedLimit = Number(baseParams?.limit);
  const limit = Number.isFinite(parsedLimit)
    ? parsedLimit
    : (childProps.limit ?? 100);

  const buildParams = (field?: string) => {
    const filters =
      baseParams?.filters &&
      typeof baseParams.filters === "object" &&
      Array.isArray((baseParams.filters as { and?: unknown[] }).and)
        ? ([...(baseParams.filters as { and: unknown[] }).and] as Array<{
            column: string;
            method: string;
            value: unknown;
          }>)
        : [];

    if (normalizedSearch && field) {
      filters.push({
        column: field,
        method: "ilike",
        value: normalizedSearch,
      });
    }

    return {
      ...baseParams,
      offset: 0,
      limit,
      ...(filters.length ? { filters: { and: filters } } : {}),
    };
  };

  const searchByIdEnabled =
    childProps.searchById !== false &&
    Boolean(normalizedSearch) &&
    searchField !== "id";
  const shouldPreferIdSearch =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      normalizedSearch,
    );

  const {
    data: dataProp,
    isLoading,
    isFetching,
  } = api.find({
    ...childProps.apiProps,
    params: buildParams(shouldPreferIdSearch ? "id" : searchField),
    reactQueryOptions: {
      placeholderData: (previousData: M[] | undefined) => previousData,
    },
  });

  const idSearchQuery = api.find({
    ...childProps.apiProps,
    params: buildParams("id"),
    reactQueryOptions: {
      enabled: searchByIdEnabled && !shouldPreferIdSearch,
    },
  });

  const selectedId =
    typeof selectedValue === "string" && selectedValue.length
      ? selectedValue
      : "";
  const selectedEntityQuery = api.findById({
    id: (selectedId || "__select-input-empty-id__") as any,
    reactQueryOptions: {
      enabled: Boolean(selectedId),
    },
  });

  useEffect(() => {
    if (!isLoading) {
      setHasLoadedOnce(true);
    }
  }, [isLoading]);

  const mergedData = useMemo(() => {
    const entities = new Map<string, M>();

    (dataProp || []).forEach((entity: any) => {
      if (entity?.id) {
        entities.set(entity.id, entity);
      }
    });

    if (searchByIdEnabled && !shouldPreferIdSearch) {
      (idSearchQuery.data || []).forEach((entity: any) => {
        if (entity?.id) {
          entities.set(entity.id, entity);
        }
      });
    }

    const selectedEntity = selectedEntityQuery.data;
    if (selectedEntity?.id) {
      entities.set(selectedEntity.id, selectedEntity);
    }

    return Array.from(entities.values());
  }, [
    dataProp,
    idSearchQuery.data,
    searchByIdEnabled,
    shouldPreferIdSearch,
    selectedEntityQuery.data,
  ]);

  if (!hasLoadedOnce && isLoading && !dataProp) {
    return _Skeleton ?? <Skeleton />;
  }

  return (
    <Child
      {...childProps}
      isServer={childProps.isServer}
      data={mergedData}
      searchValue={searchValue}
      onSearchValueChange={setSearchValue}
      isSearching={isFetching || idSearchQuery.isFetching}
    />
  );
}

export function Component<M extends { id?: string }, V>(
  props: TSelectContainerProps<M, V> | TSelectRenderProps<M, V>,
) {
  if (isContainerProps<M, V>(props)) {
    return <SelectInputDataLoader {...props} />;
  }

  return <SelectInputView {...props} />;
}
