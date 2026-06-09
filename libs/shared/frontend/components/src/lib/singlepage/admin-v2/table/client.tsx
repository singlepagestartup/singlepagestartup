"use client";
import "client-only";

import { factory } from "@sps/shared-frontend-client-api";
import { IComponentProps, IComponentPropsExtended } from "./interface";
import { Component as Skeleton } from "./Skeleton";
import { ReactNode, useEffect, useMemo } from "react";
import { useTableContext } from "../table-controller/Context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Checkbox,
} from "@sps/shared-ui-shadcn";
import { Trash2 } from "lucide-react";

function areSameStringArray(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

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
  const typedProps = props;
  const { Component: Child } = typedProps;

  const ctx = useTableContext();

  const {
    debouncedSearch = "",
    searchField = "id",
    offset = 0,
    limit = 100,
    selectedField = "id",
    selectedRowIds = [],
    visibleRowIds = [],
    bulkDeletePending = false,
    setState,
  } = ctx ?? {};
  const deleteEntity = typedProps.api.delete();

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

  const countParams = useMemo(() => {
    const filters = "filters" in params ? params.filters : undefined;

    if (!filters) {
      return;
    }

    return {
      filters,
    };
  }, [params]);

  const { data: totalData, isLoading: isTotalLoading } = typedProps.api.count({
    params: countParams,
    options: {
      ...typedProps.apiProps?.options,
      headers: {
        ...typedProps.apiProps?.options?.headers,
        "Cache-Control": "no-store",
      },
    },
  });
  const { data, isLoading } = typedProps.api.find({
    params,
    options: {
      ...typedProps.apiProps?.options,
      headers: {
        ...typedProps.apiProps?.options?.headers,
        "Cache-Control": "no-store",
      },
    },
  });
  const loadedVisibleRowIds = useMemo(() => {
    return (data ?? [])
      .map((entity) => entity.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
  }, [data]);

  useEffect(() => {
    if (typeof totalData !== "number" || !setState) {
      return;
    }

    setState((prev) => {
      return { ...prev, total: totalData };
    });
  }, [totalData, setState]);

  useEffect(() => {
    if (!setState) {
      return;
    }

    setState((prev) => {
      const nextSelectedRowIds = prev.selectedRowIds.filter((id) =>
        loadedVisibleRowIds.includes(id),
      );
      const hasVisibleChanged = !areSameStringArray(
        prev.visibleRowIds,
        loadedVisibleRowIds,
      );
      const hasSelectedChanged = !areSameStringArray(
        prev.selectedRowIds,
        nextSelectedRowIds,
      );

      if (!hasVisibleChanged && !hasSelectedChanged) {
        return prev;
      }

      return {
        ...prev,
        visibleRowIds: loadedVisibleRowIds,
        selectedRowIds: nextSelectedRowIds,
      };
    });
  }, [loadedVisibleRowIds, setState]);

  if (isLoading || isTotalLoading || !data) {
    return typedProps.Skeleton ?? <Skeleton />;
  }

  const visibleRowIdSet = new Set(visibleRowIds);
  const selectedVisibleRowIds = selectedRowIds.filter((id) =>
    visibleRowIdSet.has(id),
  );
  const hasVisibleRows = visibleRowIds.length > 0;
  const allVisibleRowsSelected =
    hasVisibleRows && selectedVisibleRowIds.length === visibleRowIds.length;
  const hasSelectedRows = selectedVisibleRowIds.length > 0;

  const toggleVisibleRows = (checked: boolean | "indeterminate") => {
    if (!setState || bulkDeletePending) {
      return;
    }

    setState((prev) => {
      const nextSelectedRowIds = checked === true ? prev.visibleRowIds : [];

      if (areSameStringArray(prev.selectedRowIds, nextSelectedRowIds)) {
        return prev;
      }

      return {
        ...prev,
        selectedRowIds: nextSelectedRowIds,
      };
    });
  };

  const bulkDeleteSelectedRows = async () => {
    if (!setState || !selectedVisibleRowIds.length) {
      return;
    }

    setState((prev) => ({
      ...prev,
      bulkDeletePending: true,
    }));

    try {
      await Promise.all(
        selectedVisibleRowIds.map((id) => deleteEntity.mutateAsync({ id })),
      );
      setState((prev) => ({
        ...prev,
        selectedRowIds: [],
        bulkDeletePending: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        bulkDeletePending: false,
      }));
    }
  };

  return (
    <>
      {hasSelectedRows ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
          <label className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={allVisibleRowsSelected}
              disabled={bulkDeletePending || !hasVisibleRows}
              aria-label="Select visible rows"
              onCheckedChange={toggleVisibleRows}
            />
            <span>{selectedVisibleRowIds.length} selected</span>
          </label>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={bulkDeletePending}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete selected
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete selected rows?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete {selectedVisibleRowIds.length} selected row
                  {selectedVisibleRowIds.length === 1 ? "" : "s"} from the
                  current page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={bulkDeletePending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={bulkDeletePending}
                  onClick={() => {
                    void bulkDeleteSelectedRows();
                  }}
                >
                  Delete selected
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : hasVisibleRows ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-card p-3 text-sm text-muted-foreground">
          <Checkbox
            checked={false}
            disabled={bulkDeletePending}
            aria-label="Select visible rows"
            onCheckedChange={toggleVisibleRows}
          />
          <span>Select visible rows</span>
        </div>
      ) : null}

      <Child {...typedProps} isServer={false} data={data} />
    </>
  );
}
