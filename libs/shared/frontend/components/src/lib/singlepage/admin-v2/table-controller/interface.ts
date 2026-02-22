import { ISpsComponentBase } from "@sps/ui-adapter";
import { ReactNode } from "react";

interface ITableControllerProps<M extends { id?: string } = { id?: string }> {
  children: ReactNode;
  searchField?: string;
  searchableFields?: string[];
  baseSearchableFields?: string[];
  baseCount?: string[];
  headless?: boolean;
  adminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  module?: string;
  name?: string;
  variant?: string;
  type?: "model" | "relation";
  className?: string;
  isServer?: boolean;
}

export interface IComponentProps<M extends { id?: string } = { id?: string }>
  extends ITableControllerProps<M> {}

export interface IComponentPropsExtended<
  M extends { id?: string } = { id?: string },
> extends IComponentProps<M> {}
