"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Input,
  Button,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@sps/shared-ui-shadcn";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { TableContext } from "./Context";
import { type IComponentProps } from "./interface";
export type { IComponentProps };

export function Component<M extends { id?: string }>(
  props: IComponentProps<M>,
) {
  const [open, setOpen] = useState(false);

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

  const baseSearchableFields = props.baseSearchableFields ?? [
    "id",
    "adminTitle",
    "title",
    "variant",
    "slug",
  ];
  const baseCount = props.baseCount ?? ["100", "200", "300", "500", "1000"];

  const availableFields = useMemo(() => {
    const all = [...baseSearchableFields, ...(props.searchableFields ?? [])];
    return Array.from(new Set(all));
  }, [baseSearchableFields, props.searchableFields]);

  const currentPage = Math.floor(state.offset / state.limit) + 1;
  const startItem = state.offset + 1;
  const endItem = state.offset + state.limit;

  const contextValue = useMemo(() => state, [state]);

  return (
    <TableContext.Provider value={[contextValue, setState]}>
      <div className="relative w-full flex flex-col gap-4 rounded-lg border border-input bg-input px-2 pt-4 pb-2">
        <div className="flex absolute top-0 inset-x-0 px-4 transform -translate-y-1/2 justify-between items-center">
          <Button variant="outline" size="sm" className="gap-2 w-fit">
            {props.title || props.name}
          </Button>
          <div className="flex items-center gap-3">
            {props.adminForm ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-3 w-3" /> Add new
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-0 lg:w-full lg:max-w-screen-lg max-h-[80vh] overflow-y-scroll">
                  <DialogTitle className="hidden">{props.title}</DialogTitle>
                  <DialogDescription className="hidden">
                    {props.title}
                  </DialogDescription>
                  {props.adminForm({
                    isServer: false,
                  })}
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        </div>
        <div className="w-full flex flex-wrap justify-between items-center gap-2 mb-4">
          <div className="flex w-full gap-4">
            <Input
              placeholder="Search..."
              value={state.search}
              onChange={(e) => {
                const value = e.target.value;
                setState((prev) => ({ ...prev, search: value, offset: 0 }));
              }}
              className="w-full"
            />

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
              <SelectTrigger className="min-w-[180px]">
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {props.children}

        <div className="flex justify-between items-center gap-3">
          <div>
            <Select value={selectedCount} onValueChange={setSelectedCount}>
              <SelectTrigger className="min-w-[180px]">
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
            <div className="text-sm text-muted-foreground mt-1">
              Page {currentPage} • {startItem}–{endItem}
              {state.total ? ` of ${state.total}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={state.offset <= 0}
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
      </div>
    </TableContext.Provider>
  );
}
