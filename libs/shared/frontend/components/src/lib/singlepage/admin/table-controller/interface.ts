import { ReactNode } from "react";

interface ITableControllerProps {
  children: ReactNode;
  searchField?: string;
  searchableFields?: string[];
  baseSearchableFields?: string[];
  baseCount?: string[];
}

export interface IComponentProps extends ITableControllerProps {}
