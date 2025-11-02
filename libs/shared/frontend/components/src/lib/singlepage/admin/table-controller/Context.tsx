"use client";

import React from "react";
import { z } from "zod";

export const TableContextSchema = z.object({
  search: z.string(),
  debouncedSearch: z.string(),
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  searchField: z.string(),
  selectedField: z.string(),
  total: z.number().int().nonnegative(),
});

export type TableContextType = z.infer<typeof TableContextSchema>;

export const TableContext = React.createContext<
  | [TableContextType, React.Dispatch<React.SetStateAction<TableContextType>>]
  | null
>(null);

export function useTableContext() {
  const ctx = React.useContext(TableContext);
  if (!ctx) return null;
  const [state, setState] = ctx;
  return { ...state, setState };
}
