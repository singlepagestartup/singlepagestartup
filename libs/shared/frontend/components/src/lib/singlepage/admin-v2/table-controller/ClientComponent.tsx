"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Input,
  Button,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@sps/shared-ui-shadcn";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { cn } from "@sps/shared-frontend-client-utils";
import { TableContext } from "./Context";
import { type IComponentProps } from "./interface";

const DEFAULT_SEARCHABLE_FIELDS = [
  "id",
  "adminTitle",
  "title",
  "variant",
  "slug",
];
const DEFAULT_PAGE_SIZES = ["2", "5", "10", "25", "50", "100"];

function getFieldLabel(field: string) {
  return field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function Component<M extends { id?: string }>(
  props: IComponentProps<M>,
) {
  const [open, setOpen] = useState(false);
  const baseSearchableFields =
    props.baseSearchableFields ?? DEFAULT_SEARCHABLE_FIELDS;
  const baseCount = props.baseCount ?? DEFAULT_PAGE_SIZES;
  const [state, setState] = useState({
    search: "",
    debouncedSearch: "",
    offset: 0,
    limit: 100,
    selectedField: "id",
    searchField: props.searchField ?? "id",
    total: 0,
  });

  const { limit } = state;
  const [selectedCount, setSelectedCount] = useState(String(limit));

  useEffect(() => {
    const t = setTimeout(() => {
      setState((prev) => ({ ...prev, debouncedSearch: prev.search }));
    }, 300);
    return () => clearTimeout(t);
  }, [state.search]);

  useEffect(() => {
    const next = Number(selectedCount);
    if (!Number.isFinite(next) || next <= 0) return;
    setState((prev) => ({ ...prev, limit: next, offset: 0 }));
  }, [selectedCount]);

  useEffect(() => {
    setSelectedCount(String(state.limit));
  }, [state.limit]);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      searchField: props.searchField ?? prev.searchField ?? "id",
    }));
  }, [props.searchField]);

  const availableFields = useMemo(() => {
    const all = [...baseSearchableFields, ...(props.searchableFields ?? [])];
    return Array.from(new Set(all));
  }, [baseSearchableFields, props.searchableFields]);

  useEffect(() => {
    if (!state.total) return;

    const totalPages = Math.max(1, Math.ceil(state.total / state.limit));
    const maxOffset = Math.max(0, (totalPages - 1) * state.limit);

    if (state.offset > maxOffset) {
      setState((prev) => ({
        ...prev,
        offset: maxOffset,
      }));
    }
  }, [state.total, state.limit, state.offset]);

  const rawCurrentPage = Math.floor(state.offset / state.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(state.total / state.limit));
  const currentPage = Math.min(rawCurrentPage, totalPages);
  const canGoPrev = state.offset > 0;
  const canGoNext = currentPage < totalPages;

  const contextValue = useMemo(() => state, [state]);

  return (
    <TableContext.Provider value={[contextValue, setState]}>
      <div
        data-module={props.module}
        data-variant={props.variant}
        {...(props.type === "relation"
          ? {
              "data-relation": props.name,
            }
          : {
              "data-model": props.name,
            })}
        className={cn("w-full space-y-3", props.className)}
      >
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search entities..."
                value={state.search}
                onChange={(e) => {
                  const value = e.target.value;
                  setState((prev) => ({ ...prev, search: value, offset: 0 }));
                }}
                className="w-full py-2 pl-9 pr-3 text-sm"
              />
            </div>

            <Select
              value={state.selectedField}
              onValueChange={(v) => {
                setState((prev) => ({
                  ...prev,
                  selectedField: v,
                  offset: 0,
                }));
              }}
            >
              <SelectTrigger className="w-[180px] shrink-0">
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {`Field: ${getFieldLabel(field)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {props.adminForm ? (
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    className="inline-flex w-fit shrink-0 items-center rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="h-screen w-full max-w-3xl overflow-y-auto p-0 sm:max-w-3xl"
                >
                  <SheetTitle className="sr-only">{props.name}</SheetTitle>
                  <SheetDescription className="sr-only">
                    {props.name}
                  </SheetDescription>
                  {props.adminForm({
                    isServer: false,
                  })}
                </SheetContent>
              </Sheet>
            ) : null}
          </div>
        </section>

        <section className="space-y-3">{props.children}</section>

        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Select value={selectedCount} onValueChange={setSelectedCount}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  {baseCount.map((c) => (
                    <SelectItem key={`c-${c}`} value={c}>
                      {c} per page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({state.total} total)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!canGoPrev}
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    offset: Math.max(0, prev.offset - prev.limit),
                  }))
                }
                className="gap-1"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={!canGoNext}
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    offset: prev.offset + prev.limit,
                  }))
                }
                className="gap-1"
                aria-label="Next page"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </TableContext.Provider>
  );
}
