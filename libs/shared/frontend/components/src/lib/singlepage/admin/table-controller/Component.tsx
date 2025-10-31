"use client";

import React, { useState, useEffect, ReactNode, useMemo } from "react";
import {
  Input,
  Button,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@sps/shared-ui-shadcn";
import { TableContext } from "./Context";

interface ITableControllerProps {
  children: ReactNode;
  searchField?: string;
  extraFields?: string[];
}

export function Component(props: ITableControllerProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selectedField, setSelectedField] = useState(
    props.searchField ?? "adminTitle",
  );
  const [selectedCount, setSelectedCount] = useState("10");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setLimit(Number(selectedCount));
    setOffset(0);
  }, [selectedCount]);

  const baseFields = ["id", "adminTitle", "title", "variant", "slug"];
  const baseCount = ["10", "20", "30", "50", "100"];

  const availableFields = useMemo(() => {
    const all = [...baseFields, ...(props.extraFields ?? [])];
    return Array.from(new Set(all));
  }, [props.extraFields]);

  const currentPage = Math.ceil(offset / limit);
  const startItem = offset;
  const endItem = offset + limit;

  const contextValue = useMemo(
    () => ({
      search,
      debouncedSearch,
      offset,
      limit,
      searchField: selectedField,
    }),
    [search, debouncedSearch, offset, limit, selectedField],
  );

  return (
    <TableContext.Provider value={contextValue}>
      <div className="w-full flex flex-col gap-4">
        <div className="w-full flex flex-wrap justify-between items-center gap-2 mb-4">
          <div className="flex w-full gap-4">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOffset(0);
              }}
              className="w-full"
            />

            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger className="w-[180px]">
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

          <div>
            <Select value={selectedCount} onValueChange={setSelectedCount}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Count per page" />
              </SelectTrigger>
              <SelectContent>
                {baseCount.map((c) => (
                  <SelectItem key={`c-${c}`} value={c}>
                    {c} per page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              Page {currentPage} • Showing {startItem}–{endItem}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              disabled={offset <= 0}
              onClick={() => setOffset((p) => Math.max(1, p - limit))}
            >
              Prev
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setOffset((p) => p + limit)}
            >
              Next
            </Button>
          </div>
        </div>

        {props.children}
      </div>
    </TableContext.Provider>
  );
}
