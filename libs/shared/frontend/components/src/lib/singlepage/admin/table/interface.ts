import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindProps } from "@sps/shared-frontend-api";
import { ReactNode } from "react";

export interface IComponentProps<M extends { id?: string }, V>
  extends ISpsComponentBase {
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
}

export type IComponentPropsExtended<
  M extends { id?: string },
  V,
  IComponentProps,
> = IComponentProps & {
  data: M[];
};
