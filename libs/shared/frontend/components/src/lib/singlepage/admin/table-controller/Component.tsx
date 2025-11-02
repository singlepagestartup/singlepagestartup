"use client";

import React, { useState, useEffect, useMemo, ReactNode } from "react";
import {
  Input,
  Button,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@sps/shared-ui-shadcn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TableContext } from "./Context";

interface ITableControllerProps {
  children: ReactNode;
  searchField?: string;
  extraFields?: string[];
  baseFields?: string[];
  baseCount?: string[];
}

export function Component(props: ITableControllerProps) {
  const [state, setState] = useState({
    search: "",
    debouncedSearch: "",
    offset: 0,
    limit: 10,
    selectedField: "adminTitle",
    searchField: props.searchField ?? "adminTitle",
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

  const baseFields = props.baseFields ?? [
    "id",
    "adminTitle",
    "title",
    "variant",
    "slug",
  ];
  const baseCount = props.baseCount ?? ["10", "20", "30", "50", "100"];

  const availableFields = useMemo(() => {
    const all = [...baseFields, ...(props.extraFields ?? [])];
    return Array.from(new Set(all));
  }, [baseFields, props.extraFields]);

  const currentPage = Math.floor(state.offset / state.limit) + 1;
  const startItem = state.offset + 1;
  const endItem = state.offset + state.limit;

  const contextValue = useMemo(() => state, [state]);

  return (
    <TableContext.Provider value={[contextValue, setState]}>
      <div className="w-full flex flex-col gap-4">
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
              onValueChange={(v) =>
                setState((prev) => ({
                  ...prev,
                  selectedField: v,
                  offset: 0,
                }))
              }
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

          <div className="flex items-end gap-3">
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

        {props.children}
      </div>
    </TableContext.Provider>
  );
}
