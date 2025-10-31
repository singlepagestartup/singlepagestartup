import { createContext, useContext } from "react";

export interface ITableContextValue {
  search: string;
  debouncedSearch: string;
  offset: number;
  limit: number;
  searchField?: string;
}

export const TableContext = createContext<ITableContextValue | undefined>(
  undefined,
);

export function useTableContext() {
  const context = useContext(TableContext);
  return context;
}
