import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindProps } from "@sps/shared-frontend-api";
import { ReactNode } from "react";

export interface IComponentProps<
  M extends { id?: string } = { id?: string },
  V = string,
> extends ISpsComponentBase {
  variant: V;
  apiProps?: {
    params?: IFindProps["params"];
    options?: IFindProps["options"];
  };
  className?: string;
  adminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  page?: number;
  limit?: number;
  debouncedSearch?: string;
  offset?: number;
  children?: ReactNode;
}

export type IComponentPropsExtended<
  M extends { id?: string } = { id?: string },
  V = string,
  T extends IComponentProps<M, V> = IComponentProps<M, V>,
> = T & {
  data: M[];
};
