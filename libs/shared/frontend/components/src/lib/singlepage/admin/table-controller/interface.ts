import { ISpsComponentBase } from "@sps/ui-adapter";
import { ReactNode } from "react";

interface ITableControllerProps<M extends { id?: string }> {
  children: ReactNode;
  searchField?: string;
  searchableFields?: string[];
  baseSearchableFields?: string[];
  baseCount?: string[];
  adminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  module?: string;
  name?: string;
  variant?: string;
  type?: "model" | "relation";
}

export interface IComponentProps<M extends { id?: string }>
  extends ITableControllerProps<M> {}
